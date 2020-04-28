# MySQL 的存储引擎

本节只是概要的描述 MySQL 的存储引擎，不会涉及太多的细节，因为存储引擎的讨论及其相关特性将会贯穿全书。本节知识也不是完全指南，如果有需要，则有必要去阅读对应存储引擎的官方文档。

在文件系统中，MySQL 将每个数据库（也称为 schema）保存为数据目录下的一个子目录。创建表时，MySQL 会在目录下创建一个和表同名的 `.frm` 文件保存表的定义。表定义是在 MySQL 服务层统一处理的，大小写敏感问题和具体的系统平台有关系（windows 不敏感），保存数据和索引的方式则是各个存储引擎实现的。

可以使用以下语句显示表的相关信息，例如，查看 mysql 数据库中的 user 表：

```sql
mysql> use mysql
-- 在 5.0 以后的版本中，也可以查询 INFORMATION_SCHEMA 中对应的表
mysql> SHOW TABLE STATUS LIKE 'user' \G;
*************************** 1. row ***************************
           Name: user
         Engine: InnoDB
        Version: 10
     Row_format: Dynamic
           Rows: 6
 Avg_row_length: 2730
    Data_length: 16384
Max_data_length: 0
   Index_length: 0
      Data_free: 4194304
 Auto_increment: NULL
    Create_time: 2020-04-15 11:26:47
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_bin
       Checksum: NULL
 Create_options: stats_persistent=0
        Comment: Users and global privileges
1 row in set (0.00 sec)
```

注意：笔者这里使用的是 MySQL8.0

上述是一个 InnoDB 的表，各项字段含义如下：

- Name：表名

- Engine：存储引擎类型，在旧版本中，该列为 Type

- Row_format：行的格式

  对于 MyISAM 表，可选值为

  - Dynamic：动态，行长度是可变的，一般包含可变长度的字段，如 VARCHAR、BLOB
  - Fixed ：固定，行长度是固定的，只包含固定长度的列，如 CHAR、INTEGER
  -  Compressed：行只在压缩表中存在，该部分可参考 MyISAM 压缩表一节
  
- Rows：表中的行数，在 InnoDB 中，该值是一个估计值

- Avg_row_length：平均每行包含的字节数

- Data_length：表数据的大小（字节）

- Max_data_length：表数据的最大容量，该值和存储引擎有关

- Index_length：索引的大小（字节）

- Data_free：

  对于 MyISAM 表，表示已分配但目前没有使用的空间。包含了之前删除的行，以及后续可以被 INSERT 利用到的空间

- Auto_increment：下一个 AUTO_INCREMENT 的值

- Create_time：表创建信息

- Update_time：表数据的最后修改时间

- Check_time：使用 CKECK TABLE 命令或则 myisamchk 工具最后一次检查表的时间

- Collation：表示默认字符集和字符列排序规则

- Checksum：如果启用，保存的是整个表的实时校验和

- Create_options：创建表时指定的其他选项

- Comment：该列包含了一些其他的额外信息。

  - 对于 MyISAM 表，保存的是表在创建时带的注释。
  - 对于 InnoDB 表，保存的是 InnoDB 表空间的剩余空间信息。
  
  如果是一个视图，则该列包含 “VIEW” 的文本字样
  

## InnoDB 存储引擎

InnoDB 是 MySQL 的默认事务型处理引擎，最重要，使用最广泛的存储引擎。被设计用来处理大量的 _短期（short-lived_）事务，短期事务大部分情况下是正常提交的，很少会被回滚。

InnoDB 的性能和自动崩溃恢复特性，使得它在非事务型存储的需求中也很流行。

总之来说，对于使用和学习都应该优先选择 InnoDB，这是收益最大的。除非有特别的原因。

### InnoDB 的历史

他的历史很复杂，了解下这段历史对于理解 InnoDB很有帮助。

2008年，Oracle 发布了下一代 InnoDB 引擎， InnoDB plugin，适用于 MySQL 5.1 版本，拥有者是 InnoDB，而不是 MySQL。这基于很多原因，mysql 并没有默认集成该引擎，而是集成了旧版本的 InnoDB 引擎，而用户可以选择使用 InnoDB plugin 来覆盖掉旧的版本，直到 Oracle 收购了 Sun 公司后发布的 MySQL 5.5 中才彻底使用 InnoDB plugin 替代了旧版本的 InnoDB（意味 InnoDB plugin 已经是原生编译了，而不是一个插件，但名字已经约定成俗，很难修改了）

这个现代的 InnoDB 版本（MySQL 5.1）中的 InnoDB plugin，支持一些新特性，例如：

- 利用排序创建索引（building index by sorting）
- 删除或增加索引时不需要复制全表数据
- 新的支持压缩的存储格式
- 新的大型列值如 BLOB 的存储方式
- 文件格式管理等

InnoDB 是一个很重要的存储引擎，很多个人和公司都对其贡献代码，而不仅仅是 Oracle 公司的开发团队。一些重要的贡献值包括 Google、Facebook 等，他们的一些改进被直接移植到官方版本，也有一些有 InnoDB 团队重新实现。在过去的几年间，InnoDB 的改进速度大大加快，主要的改进集中在可测量性、可扩展性、可配置化、性能、各种新特性和对 windows 的支持等方面。

为改善 InnoDB 的性能，Oracle 投入了大量的资源，并有很多卓有成效的工作，比如现在可以很好支持 24 核的系统，在某些场景下，32 核或更多核的系统中表现良好

### InnoDB 概览

InnoDB 的数据存储在 **表空间（tablespace）**中，表空间由一系列的数据文件组成（InnoDB 管理的一个黑盒子）。在 MySQL 4.1 以后，可以将 **每个表的数据和索引放在单独的文件中** 。

InnoDB 采用 MVCC 来支持高并发，并且实现了 4 个标准的隔离级别。默认级别为 REPEATABLE READ（可重复读），并且通过 **间歇锁（next-key locking）** 策略防止幻读的出现，使得 InnoDB 不仅仅锁定查询涉及的行，还会对索引中的间歇进行锁定，以防止幻影行的插入。

InnoDB 表是基于 **聚簇索引** 建立的（稍后章节讨论）。索引结构和 MySQL 的其他存储引擎有很的大不同，聚簇索引对主键查询有很高的性能。不过它的 **二级索引（secondary index，非主键索引）**中必须包含主键列，所以 **如果主键列很大的话，其他的所有索引都会很大**。InnoDB 的存储格式是平台独立的，也就是说数据和索引文件可以直接跨平台使用。

InnoDB 内部做了很多优化，包括

- 从磁盘读取数据时采用的可预测性预读，
- 能够自动在内存中创建 hash 索引以加速读取操作的自适应哈希索引（adaptive hash index），
- 以及能够加速插入操作的插入缓冲区（insert buffer）等。

这部分知识后续详细讨论。

InnoDB 的行为是非常复杂的，强烈建议阅读官方手册中「InnoDB 事物模型和锁」一节。了解 MVCC 架构架构带来的一些微秒和细节之处是非常有必要的。存储引擎要为所有用户甚至包括修改数据的用户维持一致性的视图，是非常复杂的工作。

InnoDB 通过一些机制和工具支持真正的热备份，如：

- MySQL Enterprise Backup：Oracle 提供
- XtraBackup：percona 开源的

其他的存储引擎不支持热备份，要获取一致性视图需要停止对所有表的写入，而在读写混合的场景中，停止写入可能也意味着停止读

## MyISAM 存储引擎

MySQL 5.1 之前是默认的存储引擎。提供了大量的特性，包括全文索引、压缩、空间函数（GIS）等。但是它不支持事物和行级锁，而且还有一个缺陷是崩溃后无法安全恢复。但是它还是有价值的，在对于只读数据、或表较小、可以忍受修复（repair）操作，则可以使用它

### 存储

MyISAM 将表存储在两个文件中：

- 数据文件：`.MYD`
- 索引文件：`.MYI`

表可以包含动态或静态（长度固定）行，根据表的定义来决定采用哪种行格式，表可以存储的行记录数据，一般受限于可用的磁盘空间，或则操作系统中单个文件的最大尺寸

在 MySQL 5.0 中，MyISAM 表如果是变长行，则默认配置只能处理 256TB 的数据，因为指向数据记录的指针长度是 6 个字节。早期版本指针长度是 4 个字节，只能处理 4GB 的数据。而所有的 MySQL 版本都支持 8 字节的指针。可通过修改表的 `MAX_ROWS` 和 `AVG_ROW_LENGTH` 选项的值来修改 MyISAM 的表指针的长度，两者相乘就是表可能达到的最大大小。**修改这两个参数会导致重建整个表和表的所有索引**

### MyISAM 特性

作为最早的存储引擎之一，有一些已经开发出来很久的特性，可以满足用户的实际需求

#### 加锁与并发

**对整张表加锁**，而不是针对行。读取时会对需要读到的所有表加共享锁，写入时则对表加排他锁。

但是在表有读取查询的同时，也可以往表中插入新的记录（这被称为并发插入，CONCURRENT INSERT）

#### 修复并发

