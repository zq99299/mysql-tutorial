# SQL 的索引优化

本章针对面试中高频考点：索引优化进行讲解，让你面试无忧，直接向面试开炮，甚至吊打面试官。

 SQL 优化的手段一般有两个方向：

- 优化 SQL 查询所涉及到的表中的索引
- 改写 SQL 以达到更好的利用索引的目的

## 索引的作用是什么？

告诉存储引擎如何快速的查找到所需要的数据，不同的存储引擎实现的索引是不同的。

这里来讲解常用的 Innodb 支持的索引类型

## Innodb 支持的索引类型

- Btree 索引：常用的类型
- 自适应 HASH 索引：自动维护
- 全文索引：对中文支持不太好
- 空间索引

## Btree 索引的特点

以 B+ 树的结构存储索引数据。

本身是一种平衡的二叉树，每一个叶子节点到根的距离都是相同的，并且记录的所有节点是按键值的大小、顺序放在同一层的叶子节点上的，并且每一个叶子节点是通过指针来连接的

- Btree 索引适用于全值匹配的查询。如

  ```sql
  class_name='mysql';
  class_name in('mysql','postgreSQL');
  -- in 也会使用到索引，不过 in 中数据较多时，sql 优化器可能会采用全表扫描的方式来查询
  ```
  
- Btree 索引适合处理范围查找

  ```
  study_cnt between 1000 and 3000
  study_cnt > 3000
  ```

- Btee 索引从索引的最左侧列开始匹配查找列

  对于多个列组合成的索引，只能从左开始查找，如

  ```sql
  create index idx_title_studyCnt on imc_course(title,study_cnt)
  
  a. study_cnt > 3000			 -- 无法用到上述的索引
  b. study_cnt > 3000 and title = 'MySQL'   -- 顺序不对，但是可以用到索引
  c. title = 'MySQL'  -- 也可以使用到
  ```

## 应该在什么列上建立索引？

这个没有一个统一的答案，这个需要结合表中的数据和表中的索引进行分析。

通常可以在以下列中建立索引：

- WHERE 子句中的列：

  不是所有的都要建立索引，要结合其他的条件，如：是否有很好的筛选性？

  筛选性：重复数据较多，就是筛选性较差。要在筛选性较好的列上建立索引
  
- 包含在 ORDER BY、GROUP BY、DISTINCT 中的字段

  可以提高排序的性能，避免使用到临时表，只有满足下列条件时：

  - 索引列的顺序与 order by 子句的顺序要完全一致
  - 索引列的方向要与 order by 中的完全一致（asc、desc）
  - 在多个表的关联查询中，order by 中的字段要全部在关联表的第一张表中

- 多表 JOIN 的关联列

  

### WHERE 子句中的列，索引示例

```sql
-- 查询出 2019 年 1 月 1 日以后注册的男性会员的昵称
explain
select user_nick
from imc_user
where sex = 1
  and reg_time > '2019-01-01'
```

执行计划是

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | SIMPLE | imc\_user | NULL | ALL | NULL | NULL | NULL | NULL | 2530 | 3.33 | Using where |

可以看到没有使用到索引，并且是使用 ALL 全表扫描了 2530 行的数据，过滤比是 3.33 %，使用到了 where 子句来过滤。

查询条件有两列，那么在哪一列上面建立索引呢？可以通过计算他们的筛选性来得出

```sql
-- 计算这两列的赛选性
select sexCount, regTimeCount, sexCount / total, regTimeCount / total
from (
         select count(distinct sex)                               as sexCount,
                count(distinct date_format(reg_time, '%Y-%m_%d')) as regTimeCount,
                count(*)                                          as total
         from imc_user) as temp
```
去重，并计算他们的百分比，日期格式化是为了去掉时分秒或则毫秒这样的，否则不同的就太多了

| sexCount | regTimeCount | sexCount / total | regTimeCount / total |
| :--- | :--- | :--- | :--- |
| 2 | 454 | 0.0008 | 0.1794 |

对于这两列来说，注册时间的可筛选性大于性别一列，在注册时间列上建立索引

```sql
create index idx_regtime on imc_user(reg_time);
```

再来执行上面的查询语句得到的计划如下

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | SIMPLE | imc\_user | NULL | range | idx\_regtime | idx\_regtime | 5 | NULL | 516 | 10 | Using index condition; Using where |

从 type 开始，使用到了范围查询，预计使用的索引是 idx\_regtime，实际使用的索引是 idx\_regtime，索引长度为 5 字节，扫描了 516 行，过滤比为 10%，使用到了索引条件。建立索引后比没有建立效率提高了很多。

再来删除掉注册时间的索引，在性别上添加索引，看看是否会使用到这个索引

```sql
drop index idx_regtime on imc_user;
create index idx_sex on imc_user(sex);
```

执行计划为

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | SIMPLE | imc\_user | NULL | ALL | idx\_sex | NULL | NULL | NULL | 2530 | 3.33 | Using where |

可以看到没有被用到性别列上的索引

### 一个复杂一点的查询语句索引优化

```sql
-- 查询课程的分类、难度、方向、标题，综合评分信息
-- 这里关联了 4 张表
explain
select course_id, b.class_name, d.type_name, c.level_name, title, score
from imc_course a
         join imc_class b on a.class_id = b.class_id
         join imc_level c on a.level_id = c.level_id
         join imc_type d on a.type_id = d.type_id
where c.level_name = '高级'
  and b.class_name = 'MySQL'
```
执行计划为，在执行计划之前，为了能和视频中的一致，这里添加一个索引

```sql
-- 注意：这里笔者也不知道到低是哪里给添加上索引的，但是视频中的确是有这个索引
create index uqx_classname on imc_class(class_name);
```

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | SIMPLE | b | NULL | ref | PRIMARY,uqx\_classname | uqx\_classname | 32 | const | 1 | 100 | Using index |
| 1 | SIMPLE | c | NULL | ALL | PRIMARY | NULL | NULL | NULL | 4 | 25 | Using where; Using join buffer \(Block Nested Loop\) |
| 1 | SIMPLE | a | NULL | ALL | NULL | NULL | NULL | NULL | 100 | 1 | Using where; Using join buffer \(Block Nested Loop\) |
| 1 | SIMPLE | d | NULL | eq\_ref | PRIMARY | PRIMARY | 2 | imc\_db.a.type\_id | 1 | 100 | NULL |

id 都是 1，从上往下看。以 b 表为驱动，只有 b 表用到了索引的，
他们的查询次数是 rows 相乘（因为这个是一个嵌套循环，row 就代表了嵌套循环的次数），大概是 400 次查询，也就是说从 b 表中获取 1 条数据，需要在 c 表中获取 4 条数据，在 a 表中获取 400 条数据，在 d 表中获取 1 条数据

其中查询次数最多的是 a 表，需要查询 100 次，先来查看这张表的索引定义

```sql
show create table imc_course;

CREATE TABLE `imc_course` (
  `course_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '课程ID',
  `title` varchar(20) NOT NULL DEFAULT '' COMMENT '课程主标题',
  `title_desc` varchar(50) NOT NULL DEFAULT '' COMMENT '课程副标题',
  `type_id` smallint(5) unsigned NOT NULL DEFAULT '0' COMMENT '课程方向ID',
  `class_id` smallint(5) unsigned NOT NULL DEFAULT '0' COMMENT '课程分类ID',
  `level_id` smallint(5) unsigned NOT NULL DEFAULT '0' COMMENT '课程难度ID',
  `online_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '课程上线时间',
  `study_cnt` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '学习人数',
  `course_time` time NOT NULL DEFAULT '00:00:00' COMMENT '课程时长',
  `intro` varchar(200) NOT NULL DEFAULT '' COMMENT '课程简介',
  `info` varchar(200) NOT NULL DEFAULT '' COMMENT '学习需知',
  `harvest` varchar(200) NOT NULL DEFAULT '' COMMENT '课程收获',
  `user_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '讲师ID',
  `main_pic` varchar(200) NOT NULL DEFAULT '' COMMENT '课程主图片',
  `content_score` decimal(3,1) NOT NULL DEFAULT '0.0' COMMENT '内容评分',
  `level_score` decimal(3,1) NOT NULL DEFAULT '0.0' COMMENT '简单易懂',
  `logic_score` decimal(3,1) NOT NULL DEFAULT '0.0' COMMENT '逻辑清晰',
  `score` decimal(3,1) NOT NULL DEFAULT '0.0' COMMENT '综合评分',
  `is_recommand` tinyint(4) DEFAULT '0' COMMENT '是否推荐，0 不推荐，1 推荐',
  PRIMARY KEY (`course_id`),
  UNIQUE KEY `udx_title` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8 COMMENT='课程主表'

-- 只有一个主键索引，和 title 的唯一索引
```

也就是说，在 a 表与 b 、c 表的关联列上没有索引，前面说到，要在关联列上建立索引

```sql
根据这个关联语句
from imc_course a
         join imc_class b on a.class_id = b.class_id
         join imc_level c on a.level_id = c.level_id
         join imc_type d on a.type_id = d.type_id
         
得到我们的联合索引，索引的排列顺序为可筛选性排列

create index idx_classid_typeid_levelid on imc_course (class_id, type_id, level_id);
```

再来看看执行的 SQL 计划

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | SIMPLE | b | NULL | ref | PRIMARY,uqx\_classname | uqx\_classname | 32 | const | 1 | 100 | Using index |
| 1 | SIMPLE | c | NULL | ALL | PRIMARY | NULL | NULL | NULL | 4 | 25 | Using where; Using join buffer \(Block Nested Loop\) |
| 1 | SIMPLE | a | NULL | ref | idx\_classid\_typeid\_levelid | idx\_classid\_typeid\_levelid | 2 | imc\_db.b.class\_id | 7 | 10 | Using index condition |
| 1 | SIMPLE | d | NULL | eq\_ref | PRIMARY | PRIMARY | 2 | imc\_db.a.type\_id | 1 | 100 | NULL |

可以看到 在 a 表上使用了索引，循环的行数从 100 降低到了 7 行。从 400 降低到 28 次了，但是优化还没有完， c 表上还没有用到索引。

观察可见

```sql
from imc_course a
         join imc_class b on a.class_id = b.class_id
         join imc_level c on a.level_id = c.level_id
         join imc_type d on a.type_id = d.type_id
where c.level_name = '高级'

-- c 表通过 level_id 与 a 表关联，并且 where 中用到了 leve_name 进行过滤
-- 这里为 c 表的 level_name 建立索引，同时知道：二级索引会带上主键。所以也满足关联主键的做法
create index idx_levelname on imc_level(level_name);
```

执行计划如下

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | SIMPLE | b | NULL | ref | PRIMARY,uqx\_classname | uqx\_classname | 32 | const | 1 | 100 | Using index |
| 1 | SIMPLE | c | NULL | ref | PRIMARY,idx\_levelname | idx\_levelname | 32 | const | 1 | 100 | Using index |
| 1 | SIMPLE | a | NULL | ref | idx\_classid\_typeid\_levelid | idx\_classid\_typeid\_levelid | 2 | imc\_db.b.class\_id | 7 | 10 | Using index condition |
| 1 | SIMPLE | d | NULL | eq\_ref | PRIMARY | PRIMARY | 2 | imc\_db.a.type\_id | 1 | 100 | NULL |

现在 c 表也用上了索引，从 4 次变成了 1 次。 最终从 400 次，降到了 7 次；

以上就是一个 SQL 优化的思路和过程，目的是减少循环次数、增加过滤的百分比。



注意：截图还没有缩减尺寸