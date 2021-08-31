# PostgreSQL

In this project we use PostgreSQL for storing experiment, factor, and attribute data. Our PostgreSQL instance is located in Amazon AWS.

### Connecting To The Database

* Link to the wiki page for setting up your machine to access the database: https://github.platforms.engineering/Cosmos/experiments-docs/wiki/Database-Access
* Be sure to setup a SSH tunnel to the database before running this application
    * With the move to AWS Aurora, you will need to setup up two SSH tunnels. One to the read/write database on port 9000 and one to the read only database on port 9001 (ports should be setup automatically)

### Backup and restore
* AWS takes automatic backups of RDS instances. By default, this is rolling week of daily backups.
* If you need to restore a backup, create a new Postgres instance through the AWS Service Catalog and supply it with the ARN of the snapshot to restore.
