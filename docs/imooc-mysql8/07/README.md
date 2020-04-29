# SQL 优化
【专家视角】揭开SQL优化神秘面纱【适用于升职加薪】

武以快为尊。同理，快速高效工作，同样的工作时长，却创造更多企业价值，凸显个人价值，才能立于不败之地。 
本章将从专家的视角，为你揭开SQL优化神秘面纱，解锁SQL优化的升职加薪技能。让你在工作中比别人技高一筹，
助你在工作中对SQL优化，慢查询优化能有独到的企业级解决方案，为你的高薪保驾护航。...
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

