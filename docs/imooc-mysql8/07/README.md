# SQL 优化
【专家视角】揭开SQL优化神秘面纱【适用于升职加薪】

武以快为尊。同理，快速高效工作，同样的工作时长，却创造更多企业价值，凸显个人价值，才能立于不败之地。 
本章将从专家的视角，为你揭开SQL优化神秘面纱，解锁SQL优化的升职加薪技能。让你在工作中比别人技高一筹，
助你在工作中对SQL优化，慢查询优化能有独到的企业级解决方案，为你的高薪保驾护航。...

笔者总结，本章实际讲解：讲解慢查询如何配置、如何分析、怎么使用 explain 查看 SQL 执行计划。

## 优化 SQL 的一般步骤

- 发现问题
- 分析执行计划
- 优化索引
- 改写 SQL：如果索引优化解决不了，就考虑改写成另外的 SQL
- 数据库垂直切分：如果上述都无法解决，那么久需要考虑分库分表了
- 数据库水平切分

## 常见问题发现渠道

- 用户主动上报应用性能问题：被动

  一般是用户发现某些功能发现问题或则缓慢

- 分析慢查询日志发现存在问题的 SQL

  可以指定一定的实际阀值，超过该值的 SQL 将会被主动记录在慢查询日志中

- 数据库实时监控长时间运行的 SQL

  比如数据库压力徒增，需要实时监控有问题的 SQL

## 配置慢查询日志

可以通过以下语句动态开关

```sql
set global slow_query_log = [ON | OFF]
```

可以通过以下语句指定慢查询日志的位置，如果不指定则默认会写在 data 目录下

```sql
set global slow_query_log_file = /sql_log/slowlog.log
```

通过如下语句设置条件，满足此条件则记录

```sql
-- 设置超过多少时间的查找则记录
-- 设置为 0 则记录有的查询
set global long_query_time = xxx.xxxx 秒 
-- 设置未使用索引的语句记录
set global log_queries_not_using_indexes = [No | OFF]
```

## 分析 MySQL 慢查询日志

当条件设置得比较宽泛时，会产生很多的慢查询 SQL，就需要借助工具来分析了：

- `mysqldumpslow [OPTS...] [LOGS...]` ：mysq 官网提供

  一般把日志文件作为参数

- `pt-query-digest [OPTIONS][FILES][DSN]`：更加好用的一款工具，是 Percona toolkit 工具包中的

他们都有把多次出现的 SQL 抽象为一个 SQL 来分析，大大提高和简化了分析

### Percona toolkit 的使用

[Percona toolkit](https://www.percona.com/software/database-tools/percona-toolkit)，在下载页面中选择 [percona-toolkit-3.2.0-1.el7.x86_64.rpm](https://www.percona.com/downloads/percona-toolkit/3.2.0/binary/redhat/7/x86_64/percona-toolkit-3.2.0-1.el7.x86_64.rpm)

在存 [储库页面](https://www.percona.com/doc/percona-repo-config/index.html) 中找到存储库的安装方式

```bash
[root@study local]# yum install https://repo.percona.com/yum/percona-release-latest.noarch.rpm
[root@study local]# yum install percona-toolkit-3.2.0-1.el7.x86_64.rpm 
# 上述下载的包如果安装不了，就只能在线安装了
[root@study local]# yum install percona-toolkit
```

### 配置 MySQL 慢查询日志

```sql
-- 先查询目前的时间
mysql> show variables like 'long_query_time';
+-----------------+-----------+
| Variable_name   | Value     |
+-----------------+-----------+
| long_query_time | 10.000000 |
+-----------------+-----------+
-- 我们本机开发呢，设置为 0 记录是由的 sql
-- 工作中，一般设置为 0.001 秒
mysql> set global long_query_time = 0;
-- 查询慢查询日志位置
mysql> show variables like 'slow_query_log_file';
-- 查询和打开慢查询日志
mysql> show variables like 'slow_query_log';
mysql> set global slow_query_log = on;

```

配置好了之后，就随意执行几条 SQL 就可以在日志文件中看到了，下面例举一个 SQL 执行记录

```sql
/* ApplicationName=DataGrip 2020.1.2 */ select count(*) from imc_course;
# Time: 2020-04-29T15:35:20.396723Z
# User@Host: root[root] @ gateway [192.168.56.1]  Id:    10
# Query_time: 0.000164  Lock_time: 0.000000 Rows_sent: 0  Rows_examined: 0

1. 查询语句，前面的注释是用工具查询自动生成的，表示了是来自哪个工具
2. 查询时间
3. 哪个用户，来自那台主机，线程 ID = 10
4. 查询耗时、锁定时间、
```

### mysqldumpslow

```bash
[root@study ~]# cd /usr/local/mysql/sql_log
[root@study sql_log]# mysqldumpslow slowlog.log 

Reading mysql slow query log from slowlog.log
Count: 1  Time=0.04s (0s)  Lock=0.01s (0s)  Rows=501.0 (501), root[root]@gateway
  /* ApplicationName=DataGrip N.N.N */ SELECT t.*
  FROM imc_db.imc_chapter t
  LIMIT N
...
有该条 sql 执行的次数、执行的时间、锁定时、返回的行数、哪个用户执行的
```

### pt-query-digest

```bash
[root@study sql_log]# pt-query-digest slowlog.log 
*******************************************************************
 Using the default of SSL_verify_mode of SSL_VERIFY_NONE for client
 is deprecated! Please set SSL_verify_mode to SSL_VERIFY_PEER
 possibly with SSL_ca_file|SSL_ca_path for verification.
 If you really don't want to verify the certificate and keep the
 connection open to Man-In-The-Middle attacks please set
 SSL_verify_mode explicitly to SSL_VERIFY_NONE in your application.
*******************************************************************
...
# 180ms user time, 30ms system time, 29.25M rss, 242.34M vsz
# Current date: Wed Apr 29 23:59:18 2020
# Hostname: study.centos.mrcode
# Files: slowlog.log
# Overall: 108 total, 18 unique, 0.14 QPS, 0.00x concurrency _____________
# Time range: 2020-04-29T15:31:41 to 2020-04-29T15:44:24
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time           93ms    52us    47ms   858us     1ms     4ms   194us
# Lock time           11ms       0     6ms    99us       0   632us       0
# Rows sent            536       0     501    4.96    0.99   46.62       0
# Rows examine       2.68k       0   1.10k   25.42       0  156.98       0
# Query size         6.25k      13     856   59.28   72.65  132.77   36.69

# Profile
# Rank Query ID                         Response time Calls R/Call V/M   I
# ==== ================================ ============= ===== ====== ===== =
#    1 0x217EA386BFC0686D9D58C106714...  0.0467 50.3%     1 0.0467  0.00 SELECT imc_db.imc_chapter
#    2 0xE77769C62EF669AA7DD5F6760F2...  0.0117 12.6%     2 0.0058  0.00 SHOW VARIABLES
#    3 0xA86446692DE3CA32943798A0901...  0.0063  6.8%    30 0.0002  0.00 SHOW WARNINGS
#    4 0xB1D4F88B1115C3B5D8D05AAE016...  0.0055  6.0%     2 0.0028  0.00 SELECT imc_course
#    5 0x83C1E5898A01E697921459BF4F1...  0.0043  4.7%    10 0.0004  0.00 SELECT
#    6 0x7A2B64842DCEDE58C32EFD50D94...  0.0034  3.7%     9 0.0004  0.00 SELECT
#    7 0xDBF338083F09B28EB07A6B495E6...  0.0030  3.3%     3 0.0010  0.00 SELECT
#    8 0xA11944C87A6A5C16FB38455BF70...  0.0030  3.2%     6 0.0005  0.00 SELECT
#    9 0xE8390778DC20D4CC04FE01C5B31...  0.0018  1.9%    16 0.0001  0.00 ADMIN PING
#   10 0xE16545BB40117FC1F9F96162CEE...  0.0014  1.5%     6 0.0002  0.00 
#   11 0xCFA134076E32C4608D274F9D0D1...  0.0014  1.5%     6 0.0002  0.00 
# MISC 0xMISC  

# Query 7: 0.01 QPS, 0.00x concurrency, ID 0xDBF338083F09B28EB07A6B495E60CF2A at byte 15710
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.00
# Time range: 2020-04-29T15:31:41 to 2020-04-29T15:41:33
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          2       3
# Exec time      3     3ms   222us     2ms     1ms     2ms   886us   515us
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       3       1       1       1       1       0       1
# Rows examine   0       0       0       0       0       0       0       0
# Query size    40   2.51k     856     856     856     856       0     856
# String:
# Databases    imc_db
# Hosts        gateway
# Users        root
# Query_time distribution
#   1us
#  10us
# 100us  ################################################################
#   1ms  ################################
#  10ms
# 100ms
#    1s
#  10s+
# EXPLAIN /*!50100 PARTITIONS*/
/* mysql-connector-java-8.0.15 (Revision: 79a4336f140499bd22dd07f02b708e163844e3d5) */SELECT  @@session.auto_increment_increment AS auto_increment_increment, @@character_set_client AS character_set_client, @@character_set_connection AS character_set_connection, @@character_set_results AS character_set_results, @@character_set_server AS character_set_server, @@collation_server AS collation_server, @@collation_connection AS collation_connection, @@init_connect AS init_connect, @@interactive_timeout AS interactive_timeout, @@license AS license, @@lower_case_table_names AS lower_case_table_names, @@max_allowed_packet AS max_allowed_packet, @@net_write_timeout AS net_write_timeout, @@sql_mode AS sql_mode, @@system_time_zone AS system_time_zone, @@time_zone AS time_zone, @@transaction_isolation AS transaction_isolation, @@wait_timeout AS wait_timeout\G

```

上面的日志信息字段说明

```bash
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          2       3
# Exec time      3     3ms   222us     2ms     1ms     2ms   886us   515us
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       3       1       1       1       1       0       1
# Rows examine   0       0       0       0       0       0       0       0
# Query size    40   2.51k     856     856     856     856       0     856
横轴的表头是下面所有公用的：
 pct：占这份日志中总的百分比，这个需要配合 attribute 来看。
 比如 count：执行次数占日志中的总次数百 2%，总共执行了 3 次
 exec time：执行时间占总的 3%，总耗时 3ms、最小 222us、最大 2ms、平均耗时 1 ms、百分之 95 的耗时是 2ms
```

### 详细的字段含义

第一部分：总体统计结果

```
Overall：总共有多少条查询
Time range：查询执行的时间范围
unique：唯一查询数量，即对查询条件进行参数化以后，总共有多少个不同的查询
total：总计   min：最小   max：最大  avg：平均
95%：把所有值从小到大排列，位置位于 95% 的那个数，这个数一般最具有参考价值
median：中位数，把所有值从小到大排列，位置位于中间那个数
  
# 该工具执行日志分析的用户时间，系统时间，物理内存占用大小，虚拟内存占用大小
# 340ms user time, 140ms system time, 23.99M rss, 203.11M vsz
# 工具执行时间
# Current date: Fri Nov 25 02:37:18 2016
# 运行分析工具的主机名
# Hostname: localhost.localdomain
# 被分析的文件名
# Files: slow.log
# 语句总数量，唯一的语句数量，QPS，并发数
# Overall: 2 total, 2 unique, 0.01 QPS, 0.01x concurrency ________________
# 日志记录的时间范围
# Time range: 2016-11-22 06:06:18 to 06:11:40
# 属性                总计      最小     最大    平均     95%  标准    中等
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# 语句执行时间
# Exec time             3s   640ms      2s      1s      2s   999ms      1s
# 锁占用时间
# Lock time            1ms       0     1ms   723us     1ms     1ms   723us
# 发送到客户端的行数
# Rows sent              5       1       4    2.50       4    2.12    2.50
# select语句扫描行数
# Rows examine     186.17k       0 186.17k  93.09k 186.17k 131.64k  93.09k
# 查询的字符数
# Query size           455      15     440  227.50     440  300.52  227.50
```

第二部分：查询分组统计结果

```
Rank：所有语句的排名，默认按查询时间降序排列，通过--order-by指定
Query ID：语句的ID，（去掉多余空格和文本字符，计算hash值）
Response：总的响应时间
time：该查询在本次分析中总的时间占比
calls：执行次数，即本次分析总共有多少条这种类型的查询语句
R/Call：平均每次执行的响应时间
V/M：响应时间Variance-to-mean的比率
Item：查询对象

# Profile
# Rank Query ID           Response time Calls R/Call V/M   Item
# ==== ================== ============= ===== ====== ===== ===============
#    1 0xF9A57DD5A41825CA  2.0529 76.2%     1 2.0529  0.00 SELECT
#    2 0x4194D8F83F4F9365  0.6401 23.8%     1 0.6401  0.00 SELECT wx_member_base
```

第三部分：每一种查询的详细统计结果

```
由下面查询的详细统计结果，最上面的表格列出了执行次数、最大、最小、平均、95%等各项目的统计。
ID：查询的ID号，和上图的Query ID对应
Databases：数据库名
Users：各个用户执行的次数（占比）
Query_time distribution ：查询时间分布, 长短体现区间占比，本例中1s-10s之间查询数量是10s以上的两倍。
Tables：查询中涉及到的表
Explain：SQL语句

# Query 1: 0 QPS, 0x concurrency, ID 0xF9A57DD5A41825CA at byte 802 ______
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.00
# Time range: all events occurred at 2016-11-22 06:11:40
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         50       1
# Exec time     76      2s      2s      2s      2s      2s       0      2s
# Lock time      0       0       0       0       0       0       0       0
# Rows sent     20       1       1       1       1       1       0       1
# Rows examine   0       0       0       0       0       0       0       0
# Query size     3      15      15      15      15      15       0      15
# String:
# Databases    test
# Hosts        192.168.8.1
# Users        mysql
# Query_time distribution
#   1us
#  10us
# 100us
#   1ms
#  10ms
# 100ms
#    1s  ################################################################
#  10s+
# EXPLAIN /*!50100 PARTITIONS*/
select sleep(2)\G
```

## 实时获取需要优化的 SQL

> 通过是监控实时发现问题

前面通过慢查询日志来获取有问题的 SQL，这种方式需要一定的周期。想要快速的获取，就需要通过监控来获取

这里提供一种监控长时间允许的 SQL 的方式：

`information_schema.PROCESSLIST`：是一个视图，该视图中存储了当前正在执行的 SQL 信息

```sql
select id, user, host, db, command, time, state, info
from information_schema.PROCESSLIST
where time >= 60

-- time 是 sql 执行的时长，比如上面是大于 60 秒的执行 sql
```

## 获取 SQL 的执行计划

### 为什么要关注执行计划？

- 了解 SQL 如何访问表中的数据

  是使用全表扫描、还是索引等方式来获取的

- 了解 SQL 如何使用表中的索引

  是否使用到了正确的索引

- 了解 SQL 锁使用的查询类型

  是否使用到了子查询、关联查询等信息

### 如何获取执行计划（EXPLAIN）

可通过 EXPLAIN 来获取到 SQL的执行计划

```sql
{EXPLAIN | DESCRIBE | DESC}
    tbl_name [col_name | wild]

{EXPLAIN | DESCRIBE | DESC}
    [explain_type]
    {explainable_stmt | FOR CONNECTION connection_id}

explain_type: {
    FORMAT = format_name
}

format_name: {
    TRADITIONAL
  | JSON
}

explainable_stmt: {
    SELECT statement
  | DELETE statement
  | INSERT statement
  | REPLACE statement
  | UPDATE statement
}

-- explainable_stmt：要分析的静态 SQL 语句
-- FOR CONNECTION connection_id：可以分析正在执行的 SQL 语句，这里的 connection_id 就是上面 information_schema.PROCESSLIST 中的 id
```

## 执行计划内容分析 explain

下面使用查询学习人数大于 3000 的查询 SQL，来了解下 explain 相关信息

```sql
explain
select course_id, title, study_cnt
from imc_course
where study_cnt > 3000
```

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | SIMPLE | imc\_course | NULL | ALL | NULL | NULL | NULL | NULL | 100 | 33.33 | Using where |

###  id 列

id 会有两种值：

- 数值：查询中的 SQL 数据对数据库对象操作的顺序
- NULL：这一行数据是由另外两个查询进行 union 后产生的

执行顺序：

- 当 ID 相同时由上到下执行。
- 当 ID 不同时，由大到小执行

第一个 SQL：由于只有一行执行计划，下面来看一个复杂一点的执行计划

```sql
-- 查询课程的分类名称、难度等级、课程名称、学习人数
explain
select course_id, class_name, level_name, title, study_cnt
from imc_course a
         join imc_class b on a.class_id = b.class_id
         join imc_level c on a.level_id = c.level_id
where study_cnt > 3000
```

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | SIMPLE | c | NULL | ALL | PRIMARY | NULL | NULL | NULL | 4 | 100 | NULL |
| 1 | SIMPLE | a | NULL | ALL | NULL | NULL | NULL | NULL | 100 | 3.33 | Using where; Using join buffer \(Block Nested Loop\) |
| 1 | SIMPLE | b | NULL | eq\_ref | PRIMARY | PRIMARY | 2 | imc\_db.a.class\_id | 1 | 100 | NULL |

id 相同的，由上到下来分析计划，第一行的 table = c：指以该表为主表作为循环嵌套来查询的，虽然我们用 a 来作为主表查询的，实际上执行是以 c 为主表



第二个 SQL：再来看下 id 不同的计划分析

```sql
explain
select a.course_id, a.title
from imc_course a
where a.course_id not in (select b.course_id from imc_chapter b)
```

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | PRIMARY | a | NULL | index | NULL | udx\_title | 62 | NULL | 100 | 100 | Using where; Using index |
| 2 | DEPENDENT SUBQUERY | b | NULL | index\_subquery | udx\_couseid | udx\_couseid | 4 | func | 13 | 100 | Using index |

第三个 SQL：带 union 查询的计划

```sql
explain
select course_id, class_name, level_name, title, study_cnt
from imc_course a
         join imc_class b on a.class_id = b.class_id
         join imc_level c on a.level_id = c.level_id
where study_cnt > 3000
union
select course_id, class_name, level_name, title, study_cnt
from imc_course a
         join imc_class b on a.class_id = b.class_id
         join imc_level c on a.level_id = c.level_id
where class_name = 'MySQL'
```

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | PRIMARY | c | NULL | ALL | PRIMARY | NULL | NULL | NULL | 4 | 100 | NULL |
| 1 | PRIMARY | a | NULL | ALL | NULL | NULL | NULL | NULL | 100 | 3.33 | Using where; Using join buffer \(Block Nested Loop\) |
| 1 | PRIMARY | b | NULL | eq\_ref | PRIMARY | PRIMARY | 2 | imc\_db.a.class\_id | 1 | 100 | NULL |
| 2 | UNION | b | NULL | ALL | PRIMARY | NULL | NULL | NULL | 13 | 10 | Using where |
| 2 | UNION | a | NULL | ALL | NULL | NULL | NULL | NULL | 100 | 10 | Using where; Using join buffer \(Block Nested Loop\) |
| 2 | UNION | c | NULL | eq\_ref | PRIMARY | PRIMARY | 2 | imc\_db.a.level\_id | 1 | 100 | NULL |
| NULL | UNION RESULT | &lt;union1,2&gt; | NULL | ALL | NULL | NULL | NULL | NULL | NULL | NULL | Using temporary |


### select_type 列

有以下几种类型：

- SIMPLE：不包含子查询或是 UNION 操作的查询
- PRIMARY：查询中如果包含任何子查询，那么最外层的查询则被标记为 PRIMARY
- SUBQUERY：SELECT 列表中的子查询
- DEPENDENT SUBQUERY：依赖外部结果的子查询
- UNION：union 操作的第二个或是之后的查询的值为 union
- DEPENDENT UNION：当 UNION 作为子查询时，第二或是第二个后的查询的 select_type 值
- UNION RESULT：UNION 产生的结果集
- DERIVED：出现在 FROM 子句中的子查询

刚刚第一个 SQL 中，使用了 join 查询，但是是 SIMPLE 的类型、第二个 SQL 中，id=1 的计划就讲 a 表标记为了 PRIMARy

### table 列

表示执行计划表中的数据是由哪个表输出的

- 表名：指明从哪个表中获取数据，有原始表名，或则别名
- `<unionM,N>`：表示由 ID 为 M.N 查询 union 产生的结果集
- `<derived N>/<subquery N>`：由 ID 为 N 的查询产生的结果集

### partitions 列
只有在查询分区表的时候，才会显示分区表的 ID
### type 列

通常通过 type 可以知道查询使用的连接类型。

::: tip

在 MySQL 中，并不是只有通过 join 产生的关联查询才叫关联查询。

就算只查询一个表，也会认为是一个连接查询

:::

type 按照性能从高到低排列如下：

- `system` （性能最高）

  这是 const 连接类型的一个特列，当查询的表只有一行时使用

- `const`

  表中有且只有一个匹配的行时使用，如对住建或是唯一索引的查询，这是效率最高的连接方式

- `eq_ref`

  唯一索引或主键引查找，对于每个索引键，表中只有一条记录与之匹配；

  是以前面表返回的数据行为基础，对于每一行数据都会从本表中读取一行数据

- `ref`

  非唯一索引查找、返回匹配某个单独值的所有行

- `ref_or_null`

  类似于 ref 类型的查询，但是附加了对 NULL 值列的查询

- `index_merge`

  该连接类型表示使用了索引合并优化方法；

  mysql 5.6 之前，一般只支持一个索引查询，后来支持索引合并之后，可以支持多个索引查询

- `range`

  索引范围扫描，常见于 between、`>`、`<` 这样的查询条件

- `index`

  FULL index Scan 全索引扫描，同 ALL 的区别是，遍历的是索引树

- `ALL` （性能最底）

  FULL TABLE Scan 权标扫表这是效率最差的连接方式

### possible_keys 列

指出查询中可能会用到的索引

### key 列

possible_keys 列出的是可能使用到的索引，key 则是表示实际使用到的索引

- 如果为 NULL，则表示该表中没有使用到索引
- 如果出现的值，没有存在 possible_keys 中，查询可能使用到的是覆盖索引

### key_len 列

实际使用索引的最大长度。

**注意：**比如在一个联合索引中，如果有 3 列且总字节长度是 100 字节，key_len 可能少于 100 字节的，比如只有 30 个字节，这就说明在查询中没有到联合索引中的所有列，而是只使用到了联合索引中的部分列。

**注意：** 这一列的字节计算方式是以表中定义列的字节方式，而不是数据的实际长度

### ref 列

指出哪些列或常量被用于索引查找；

下面通过一个简单的语句来说明下现在所知道的列信息

```sql
explain
select *
from imc_user a
where user_id = 1
```

| id | select\_type | table | partitions | type | possible\_keys | key | key\_len | ref | rows | filtered | Extra |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | SIMPLE | a | NULL | const | PRIMARY | PRIMARY | 4 | const | 1 | 100 | NULL |

只出现了一行：

- 是 SIMPLE 类
- 从 a 表中输出的数据
- 不是查询的分区表
- `type=const`：是常量，`user_id = 1` 我们用了一个具体的数值 1
- 有可能使用到的索引有：PRIMARY
- 实际使用到的索引：PRIMARY （主键索引）
- 索引的长度是 4 ，这个表定义的 id 就是占用 4 字节
- 使用的是常量过滤

### rows 列

有两方面的含义：

- 根据统计信息预估的扫描的行数

- 在关联查询中，也表示内嵌循环的次数

  每获取一个值，就要对目标表进行一次查找，循环越多，性能就越差

### filtered 列

与 rows 有一定的关系，表示返回结果的行数占需要读取行数（rows）的百分比。

也是一个预估值，不太准确，但是可以在一定程度上可以预估 mysql 的查询成本。

该值越高，效率也越高

### Extra 列

包含了不适合在其他列中显示的一些额外信息。常见的值有如下：

- `Distinct`

  优化 distinct 操作，在找到第一匹配的元组后即停止找同样值的动作

- `Not exists`

  使用 not exists 来优化查询

- `Using filesort`

  使用文件来进行排序，通常会出现在 order by 或 group by 查询中

- `Using index`

  使用了覆盖索引进行查询；

  覆盖索引：查询中使用到的信息是完全可以通过索引信息来获取的，而不用去从表中的数据进行访问

- `Using temporary`

  MySQL 需要使用临时表来处理查询，常见于排序、子查询、和分组查询

- `Using where`

  需要在 MySQL 服务器层使用 Where 条件来过滤数据

- `select tables optimizedaway`

  直接通过索引来获得数据，不用访问标

::: tip

当该列的值出现了 Using temporary 时，就需要重点关注了，通常来说性能不会太好

:::



## explain 列含义汇总整理

- id 

	- 数值：查询中的 SQL 数据对数据库对象操作的顺序
  - NULL：这一行数据是由另外两个查询进行 union 后产生的
  
  当 ID 相同时由上到下执行，当 ID 不同时，由大到小执行
- select_type ： 查询类型

	- SIMPLE：不包含子查询或是 UNION 操作的查询
  - PRIMARY：查询中如果包含任何子查询，那么最外层的查询则被标记为 PRIMARY
  - SUBQUERY：SELECT 列表中的子查询
  - DEPENDENT SUBQUERY：依赖外部结果的子查询
  - UNION：union 操作的第二个或是之后的查询的值为 union
  - DEPENDENT UNION：当 UNION 作为子查询时，第二或是第二个后的查询的 select_type 值
  - UNION RESULT：UNION 产生的结果集
  - DERIVED：出现在 FROM 子句中的子查询

- table ：表示执行计划表中的数据是由哪个表输出的
	
	- 表名：指明从哪个表中获取数据，有原始表名，或则别名
	- `<unionM,N>`：表示由 ID 为 M.N 查询 union 产生的结果集
	- `<derived N>/<subquery N>`：由 ID 为 N 的查询产生的结果集

- partitions：只有在查询分区表的时候，才会显示分区表的 ID

- type：通常通过 type 可以知道查询使用的连接类型。

  type 按照性能从高到低排列如下：

  - `system` （性能最高）

    这是 const 连接类型的一个特列，当查询的表只有一行时使用

  - `const`

    表中有且只有一个匹配的行时使用，如对住建或是唯一索引的查询，这是效率最高的连接方式

  - `eq_ref`

    唯一索引或主键引查找，对于每个索引键，表中只有一条记录与之匹配；

    是以前面表返回的数据行为基础，对于每一行数据都会从本表中读取一行数据

  - `ref`

  	非唯一索引查找、返回匹配某个单独值的所有行

  - `ref_or_null`

    类似于 ref 类型的查询，但是附加了对 NULL 值列的查询

  - `index_merge`

    该连接类型表示使用了索引合并优化方法；

    mysql 5.6 之前，一般只支持一个索引查询，后来支持索引合并之后，可以支持多个索引查询

  - `range`

    索引范围扫描，常见于 between、`>`、`<` 这样的查询条件

  - `index`

    FULL index Scan 全索引扫描，同 ALL 的区别是，遍历的是索引树

  - `ALL` （性能最底）

    FULL TABLE Scan 权标扫表这是效率最差的连接方式
- possible_keys：指出查询中可能会用到的索引

- key：表示实际使用到的索引

  - 如果为 NULL，则表示该表中没有使用到索引
  - 如果出现的值，没有存在 possible_keys 中，查询可能使用到的是覆盖索引
- key_len：实际使用索引的最大长度
	
	这一列的字节计算方式是以表中定义列的字节方式，而不是数据的实际长度
- ref：指出哪些列或常量被用于索引查找

- rows：

  有两方面的含义：

  - 根据统计信息预估的扫描的行数

  - 在关联查询中，也表示内嵌循环的次数

    每获取一个值，就要对目标表进行一次查找，循环越多，性能就越差
- filtered：表示返回结果的行数占需要读取行数（rows）的百分比。

- Extra：包含了不适合在其他列中显示的一些额外信息
	
	常见的信息有：
	- `Distinct`

    优化 distinct 操作，在找到第一匹配的元组后即停止找同样值的动作

  - `Not exists`

    使用 not exists 来优化查询

  - `Using filesort`

    使用文件来进行排序，通常会出现在 order by 或 group by 查询中

  - `Using index`

    使用了覆盖索引进行查询；

    覆盖索引：查询中使用到的信息是完全可以通过索引信息来获取的，而不用去从表中的数据进行访问

  - `Using temporary`

    MySQL 需要使用临时表来处理查询，常见于排序、子查询、和分组查询

  - `Using where`

    需要在 MySQL 服务器层使用 Where 条件来过滤数据

  - `select tables optimizedaway`

    直接通过索引来获得数据，不用访问标