'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip:     process.env.OPENSHIFT_NODEJS_IP ||
          process.env.IP ||
          undefined,

  // Server port
  port:   process.env.OPENSHIFT_NODEJS_PORT ||
          process.env.PORT ||
          8080,

  sequelize: {
    uri:  process.env.DATABASE_URL ||
          'mysql://root:' + process.env.MARIADB_ENV_MYSQL_ROOT_PASSWORD + '@' + process.env.MARIADB_PORT_3306_TCP_ADDR + ':' + process.env.MARIADB_PORT_3306_TCP_PORT + '/doubletf',
    options: {
      logging: false,
      define: {
        timestamps: false
      }
    }
  }
};
