const ADODB = require('node-adodb');

class AccessConnect {
    constructor(Config) {
        this.path=Config.punchDestination;
        this.pathString=`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${this.path};Jet OLEDB:Database Password=SSS;`
        this.connection = ADODB.open(this.pathString);
    }
    // Provider=Microsoft.Jet.OLEDB.4.0;Data Source=d:\Northwind.mdb;Jet OLEDB:System Database=d:\NorthwindSystem.mdw;User ID=*****;Password=*****;
    ExecuteQuery(query){
        return new Promise((resolve,reject)=>{
            this.connection
                .query(query)
                .then(data => {
                    resolve(data)
                })
                .catch(error => {
                    console.error(error);
                    reject(error)
                });
        })
    };
}

export default AccessConnect;
