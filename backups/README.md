# backup-storage

Helm chart to deploy the `bcgov/backup-container` solution.

Original README and helm chart can be found here: https://github.com/bcgov/helm-charts/tree/master/charts/backup-storage

This is a customized version of the original readme and value.yaml files for the BRM Application.

See: https://github.com/BCDevOps/backup-container for the code.

## Chart Details

This chart will do the following:

- Deploy a backup solution for a mongoDB database.

## Installing the Chart

To install the chart with the release name `bre-db-backup` and the customized values.yaml file:

```bash
$ helm repo add bcgov https://bcgov.github.io/helm-charts
$ helm install bre-db-backup -f values.yaml bcgov/backup-storage
```

## Updating the Chart

To update the chart with the release name `bre-db-backup` and the customized values.yaml file:

```bash
$ helm repo update
$ helm upgrade bre-db-backup -f values.yaml bcgov/backup-storage
```

## Configuration

The following tables list the configurable parameters of the `backup-storage` chart and their default values.

| Parameter                                               | Description                                                                                                                                                                          | Default               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `backupConfig           `                               | Backup config details                                                                                                                                                                | See below             |
| `persistence.backup.mountPath          `                | Where the volume for storing backups is mounted                                                                                                                                      | /backups/             |
| `persistence.backup.claimName           `               | If the PVC is created outside the chart, specify the name here                                                                                                                       |                       |
| `persistence.backup.size           `                    | To create the PVC, omit the `claimName` and specify the size                                                                                                                         |                       |
| `persistence.backup.storageClassName           `        | To create the PVC, omit the `claimName` and specify the storageClassName                                                                                                             | netapp-block-standard |
| `persistence.backup.storageAccessMode           `       | PVC [access mode](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes)                                                                                      | ReadWriteOnce         |
| `persistence.verification.mountPath          `          | Where the volume for the verification database is mounted                                                                                                                            | /var/lib/mongodb/data |
| `persistence.verification.claimName           `         | If the PVC is created outside the chart, specify the name here                                                                                                                       |                       |
| `persistence.verification.size           `              | To create the PVC, omit the `claimName` and specify the size                                                                                                                         |                       |
| `persistence.verification.storageClassName           `  | To create the PVC, omit the `claimName` and specify the storageClassName                                                                                                             | netapp-block-standard |
| `persistence.verification.storageAccessMode           ` | PVC [access mode](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes)                                                                                      | ReadWriteOnce         |
| `db.secretName           `                              | The secret that has the database credentials                                                                                                                                         |                       |
| `db.usernameKey           `                             | The key in the secret that has the db username                                                                                                                                       |                       |
| `db.passwordKey           `                             | The key in the secret that has the db password                                                                                                                                       |                       |
| `env.*           `                                      | Environment variables for the solution - see `values.yaml`                                                                                                                           |                       |
| `env.MONGODB_AUTHENTICATION_DATABASE           `        | This is only required if you are backing up mongo database with a separate authentication database.                                                                                  |                       |
| `env.MSSQL_SA_PASSWORD           `                      | The database password to use for the local backup database.                                                                                                                          |                       |
| `env.TABLE_SCHEMA           `                           | The table schema for your database. Used for Postgres backups.                                                                                                                       |                       |
| `env.BACKUP_STRATEGY           `                        | The strategy to use for backups; for example daily, or rolling.                                                                                                                      | rolling               |
| `env.FTP_SECRET_KEY           `                         | The FTP secret key is used to wire up the credentials associated to the FTP.                                                                                                         |                       |
| `env.FTP_URL           `                                | The URL of the backup FTP server                                                                                                                                                     |                       |
| `env.FTP_USER           `                               | FTP user name                                                                                                                                                                        |                       |
| `env.FTP_PASSWORD           `                           | FTP password                                                                                                                                                                         |                       |
| `env.WEBHOOK_URL           `                            | The URL of the webhook to use for notifications. If not specified, the webhook integration feature is disabled.                                                                      |                       |
| `env.ENVIRONMENT_FRIENDLY_NAME           `              | The human readable name of the environment. This variable is used by the webhook integration to identify the environment in which the backup notifications originate.                |                       |
| `env.ENVIRONMENT_NAME           `                       | The name or Id of the environment. This variable is used by the webhook integration to identify the environment in which the backup notifications originate.                         |                       |
| `env.BACKUP_DIR           `                             | The name of the root backup directory. The backup volume will be mounted to this directory.                                                                                          | /backups/             |
| `env.BACKUP_CONF          `                             | Location of the backup configuration file                                                                                                                                            | /conf/backup.conf     |
| `env.NUM_BACKUPS           `                            | Used for backward compatibility only. Ignored when using the recommended `rolling` backup strategy. The number of backup files to be retained. Used for the `daily` backup strategy. |                       |
| `env.DAILY_BACKUPS           `                          | The number of daily backup files to be retained. Used for the `rolling` backup strategy.                                                                                             | 12                    |
| `env.WEEKLY_BACKUPS           `                         | The number of weekly backup files to be retained. Used for the `rolling` backup strategy.                                                                                            | 8                     |
| `env.MONTHLY_BACKUPS           `                        | The number of monthly backup files to be retained. Used for the `rolling` backup strategy.                                                                                           | 6                     |

The `env.*` format follows:

```
  ENV_VAR_NAME:
    value: "ENV_VAR_VALUE"
    secure: false
```

The `secure` parameter is by default `false`; if it set to `true` then the value will be put into a secret and referenced in the deployment.

**backup.conf**:
The backup.conf file is used to configure the backup schedules. The default schedule is set to run every day at 1:00 AM. The schedule can be changed by modifying the values.yaml file. The two different environments can be specified by using the following syntax:
Production: mongo=brms-db:27017/brms-db
Development: mongo=brms-db:27017/nest

Example:

```
backupConfig: |
  mongo=brms-db:27017/brms-db

  0 1 * * * default ./backup.sh -s
  0 4 * * * default ./backup.sh -s -v all
```

**Volume Claims:** Please note, when using the recommended nfs-backup storage class the name of the pvc MUST be taken from the manually provisioned claim; nfs-backup storage MUST be provisioned manually.
