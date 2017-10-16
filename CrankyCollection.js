var CrankyCollection = function() {
        var prm2 = arguments[arguments.length - 1];
        var ret = [];
        var query;
        var arg = arguments;
        var index = 0;
        var readstart = -1;
        var jumper = {};
        new Array(arguments.length - 1).fill(0).map(function(d, i) {
                return i
        }).forEach(function(i) {
                var prm1 = arg[i];
                var count = 0;
                var sp = JSON.parse(JSON.stringify(prm1));
                while (typeof(query = prm1.shift()) !== "undefined") {
                        if (count > 100) {
                                break;
                        }
                        switch (true) {
                                case Array.isArray(query):
                                        if (query.findIndex(function(d) {
                                                        var tmp = prm2.indexOf(d, index)
                                                        if (tmp != -1) {
                                                                index = tmp + query.length - 1;
                                                                return true;
                                                        }
                                                        return false;
                                                }) == -1) {
                                                return;
                                        }
                                        break;
                                case typeof query == "object":
                                        if (Object.keys(query).length == 0) {
                                                prm1 = JSON.parse(JSON.stringify(sp))
                                                continue;
                                        }
                                        Object.keys(query).forEach(function(key) {
                                                if (key in jumper) {
                                                        if (query[key] == true) {
                                                                index = jumper[key];
                                                                delete jumper[key]
                                                        }
                                                } else {
                                                        if (query[key] == true) {
                                                                jumper[key] = index;
                                                        }
                                                }
                                        })
                                        break;
                                case typeof query == "function":
                                        while (query(prm2.substr(index, 1))) {
                                                index++;
                                                if (prm2.length == index) {
                                                        break;
                                                }
                                        }
                                        break;
                                case typeof query == "string":
                                        var i = prm2.indexOf(query, index)
                                        if (i != -1) {
                                                index = i + query.length;
                                        } else {
                                                return;
                                        }
                                        break;
                                case typeof query == "boolean":
                                        if (query) {
                                                readstart = index
                                        } else {
                                                ret.push(prm2.substring(readstart, index))
                                                readstart = -1;
                                        }
                                        break;
                                case typeof query == "number":
                                        index += query;
                                        if(index+1>prm2.length){
				return;
                                        }
                                        break;
                        }
                        count++;
                }
        })
        if (readstart != -1) {
                ret.push(prm2.substring(readstart));
        }
        return ret;
}

var $$ = CrankyCollection
module.exports = $$;
