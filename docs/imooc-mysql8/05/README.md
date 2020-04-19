# 玩转 SQL 之 日常工作

本章品味独特，剑指Geek Style。围绕核心是“工作”，针对日常工作常用的知识。包含工作基本功+工作必备技，两大部分： 【工作基本功】DCL& DDL& DML； 【工作必备技 】常用函数。

## 初始 SQL

- 什么是 SQL：一种描述性语言
- SQL 语言的作用：对存储在 RDBMS 中的数据进行增删改查等操作
- 常用的 SQL 语言的种类：DCL、DDL、DML、TCL
  - DCL：数据库管理语句
  - DDL：数据定义类语句
  - DML：数据操作语句
  - TCL：事物控制类语句

## 访问控制语句

访问数据库必须要有相应权限的账户，root 是一个超级账户，需要为程序建立一般账户，这类语句就属于 DCL（Data Control Language）

- 建立数据库账户：create user
- 对用户授权：grant
- 收回用户权限：revoke

更详细的请参考 [官网文档](https://dev.mysql.com/doc/refman/8.0/en/account-management-statements.html)，下面进行一些常用知识的讲解

### 创建数据库账户

```sql
CREATE USER [IF NOT EXISTS]
    user [auth_option] [, user [auth_option]] ...
    DEFAULT ROLE role [, role ] ...
    [REQUIRE {NONE | tls_option [[AND] tls_option] ...}]
    [WITH resource_option [resource_option] ...]
    [password_option | lock_option] ...
    [COMMENT 'comment_string' | ATTRIBUTE 'json_object']
```

- user：由两部分组成 `用户名@访问控制列表`

  访问控制列表：决定用户可以从哪些客户端访问

```sql
-- 建立程序使用的数据库账户
CREATE USER mc_class@'192.168.56.%' IDENTIFIED WITH 'mysql_native_password' by '1234567';
```



### 数据库用户授权

### 数据库用户授权收回

