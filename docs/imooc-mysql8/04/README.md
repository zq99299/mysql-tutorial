#  如何访问 MySQL

常用客户端：

- 命令行工具：mysql

  随 Mysql 服务器安装而安装的工具

- 图形化管理工具：SQLyog、Navicat

- MySQL 连接器：Connector/ODBC、Connector/J

  官方支持的驱动程序

## 命令行工具 mysql

```sql
mysql -uroot -p -hlocalhost 

选项与参数：
	-u：用户
	-p：使用交互密码
	-h：链接指定的 mysql 服务器
```

## Python 访问 mysql

```bash
yum install python-setuptools python-deve
# 使用 python 安装 pip 工具
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
pip install --upgrade setuptools
pip install PyMySQL

# 进入 python 交互界面
& python
>>> help
help > module 
# 在输出信息中找到 pymysql 模块
help > prompt
# 导入一下，如果不报错，就表示没有问题
>>> import pymysql
```

本章不再继续，笔者暂时不会使用 python 

