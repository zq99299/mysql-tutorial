# 阿里新零售数据库设计与实战

从 0 到 1 实战新零售，数据库设计与实现。

- [开门见山](./01/)
- [前置准备](./02/)
    - [新零售业务介绍](./02/01.md)
    - [前置知识与环境要求](./02/02.md)
- [前导知识](./03/)
    - [安装/配置 MySQL 数据库](./03/01.md)
    - [如何看懂 ER 图](./03/02.md)
    - [MySQL 基础 - CRUD](./03/03.md)
    - [事务机制](./03/04.md)
- [新零售数据结构设计](./04/)
    - [什么是 SPU/SKU](./04/01.md)
    - [设计品类表和参数表](./04/02.md)
    - [设计品牌和分类关系表](./04/03.md)
    - [设计产品表和商品表](./04/04.md)
    - [如何设计商品的库存？](./04/05.md)
    - [设计客户表](./04/06.md)
    - [设计购物卷表](./04/07.md)
    - [设计订单表](./04/08.md)
    - [设计员工与用户表](./04/09.md)
    - [设计快递表和退货表](./04/10.md)
    - [设计评价表](./04/11.md)
    - [设计供货商数据表](./04/12.md)
    - [设计采购与入库数据表](./04/13.md)
    - [总结](./04/14.md)
- [常见问题与企业级解决方案-初级](./05/)
    - [主键用数字还是 UUID？](./05/01.md)
    - [在线修改表结构](./05/02.md)
    - [订单和流水号的区别](./05/03.md)
    - [逻辑删除还是物理删除](./05/04.md)
    - [千万记录，如何快速分页](./05/05.md)
    - [读多写少和读多写多](./05/06.md)
    - [删改数据如何避免锁表？](./05/07.md)
- [常见问题与企业级解决方案-进阶](./06/) 
    - [如何实现商品秒杀](./06/01.md) 
    - [什么是存储过程?](./06/02.md) 
    - [什么是函数？](./06/03.md) 
    - [什么是触发器?](./06/04.md) 
    - [为什么不要使用存储过程?](./06/05.md) 
    - [如何避免偷换交易中的商品信息？](./06/06.md) 
    - [如何抵御 XSS 攻击？](./06/07.md) 
- [常见问题与企业级解决方案-高阶](./07/) 
    - [数据库/程序 缓存如何选？](./07/01.md) 
    - [智能拆分订单](./07/02.md) 
    - [中文分词技术](./07/03.md) 
    - [本章总结](./07/04.md) 
- [新零售系统数据库性能调优](./08/) 
    - [MySQL 压力测试](./08/01.md) 
    - [SQL 语句的优化](./08/02.md) 
    - [MySQL 参数优化](./08/03.md) 
    - [MySQL 慢查询日志](./08/04.md) 
    - [本章总结](./08/05.md) 
- [新零售系统数据库集群](./09/)
    - [数据库集群能解决什么问题？](./09/01.md) 
    - [如何使用 Docker 虚拟机](./09/02.md) 
    - [分布式 Docker 环境](./09/03.md) 
    - [搭建 PXC 集群](./09/04.md) 
    - [搭建 Replication 集群](./09/05.md) 
    - [本章总结](./09/06.md) 
- [分库分表的 N 种姿势](./10/)
    - [垂直切分与水平切分](./10/01.md) 
    - [安装 MyCat](./10/02.md) 
    - [配置 MyCat](./10/03.md) 
    - [启动 MyCat](./10/04.md) 
    - [Mycat 垂直/水平切分/全局表](./10/05.md) 
    - [MyCat 路由规则](./10/06.md) 
    - [避免跨分配表连接：父子表](./10/07.md) 
    - [全局主键](./10/08.md) 
    - [本章总结](./10/09.md) 
- [集群环境下的新零售数据库与总结](./11/) 
- [新零售数据库在双十一不 down 机的秘诀？](./12/) 
    - [MyCat 双机热备方案](./12/01.md) 
    - [使用 Portainer 管理 Docker](./12/02.md) 
    - [Binlog 日志文件的重要性](./12/03.md) 
    - [主从同步原理](./12/04.md) 
    - [高可用 Replication 集群](./12/05.md) 
