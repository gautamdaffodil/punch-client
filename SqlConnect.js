import mysql from 'mysql';
class SqlConnect {
    constructor(Config) {
        this.SqlConnect = mysql.createPool({
            connectionLimit: 10,
            host: Config.host,
            user: Config.user,
            password: Config.password,
            database: Config.database
        })
        this.SqlConnect.getConnection((err, connection) => {
            if (err) {
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.error('Database connection was closed.')
                }
                if (err.code === 'ER_CON_COUNT_ERROR') {
                    console.error('Database has too many connections.')
                }
                if (err.code === 'ECONNREFUSED') {
                    console.error('Database connection was refused.')
                }
            }
            if (connection) {
                connection.release()
            }
            return;
        })
    }

    ExecuteQuery(query) {
        return new Promise((resolve, reject) => {
            this.SqlConnect.query(query, (err, data) => {
                if (err) {
                    reject(err)
                }
                resolve(data)
            })
        })
    }
}
export default SqlConnect;
