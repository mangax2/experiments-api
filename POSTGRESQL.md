# PostgreSQL

In this project we use PostgreSQL for storing experiment, factor, and attribute data. Our PostgreSQL instance is located in Amazon AWS.

## Non-Prod AWS RDS Instance

### Details

* Host: velocity-experiments-db.c6ftfip45sqv.us-east-1.rds.amazonaws.com
* Port: 5432

### Connecting To The Database

* We use PGAdmin to connect to the database.
* If you don't have a Bastion user follow the steps listed here:https://github.platforms.engineering/CloudOps/docs/wiki/Bastion-SSH-Tunneling
* To connect to the database, run 'ssh cf-np -L 9000:velocity-experiments-db.c6ftfip45sqv.us-east-1.rds.amazonaws.com:5432' on the terminal, and then open PGAdmin, and connect using localhost:9000, and the AWS RDS username and password.


### Backup and restore
* AWS takes automatic backups of RDS instances.
* Currently Dev team does not have access to restore and this action is performed by Cloud Ops team.
* Login to AWS console and go to RDS instance , click on snapshots section and note down DB Snapshot name e.g. rds:velocity-experiments-db-2016-08-03-06-00.
* Send restore request to Cloud Ops team with DB Snapshot name and db instance name.
* Verify restored data base.


## Prod AWS RDS Instance

### Details

* Host: velocity-experiments-prod-db.cn8fbnlhx4nv.us-east-1.rds.amazonaws.com
* Port: 5432

### Connecting To The Database

* We use PGAdmin to connect to the database.
* If you don't have a Bastion user follow the steps listed here:https://github.platforms.engineering/CloudOps/docs/wiki/Bastion-SSH-Tunneling
* To connect to the database, run 'ssh cf-prod -L 9000:<GET RDS HOST>:5432' on the terminal, and then open PGAdmin, and connect using localhost:9000, and the AWS RDS username and password.

