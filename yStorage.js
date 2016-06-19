var BASETAG = '_baseInfo', // 存储 Storage 配置信息
    INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7天清理一下 localStorage

// Empty Function
function EmplyFunc() {}

// Null Function
function NullFunc() {
    return null;
}

// 空的 Storage，模拟相关接口
var EmplyStorage = {
    size: function() {
        return 0;
    },
    get: NullFunc,
    set: EmplyFunc,
    remove: EmplyFunc,
    clear: EmplyFunc
};

// 根据 type 创建 Storage 对象
function createStorage(type) {
    var storage = (type in window) && window[type];
    return storage ? {
        // 获取 Size
        size: function() {
            return storage.length;
        },
        // 通过 index 获取键值 key
        key: (function() {
            return storage.key ? function(index) {
                return storage.key(index);
            } : NullFunc;
        })(),
        // 通过键值 key 获取数据
        get: (function() {
            return storage.getItem ? function(key) {
                try {
                    return JSON.parse(storage.getItem(key));
                } catch (e) {
                    return null;
                }
            } : NullFunc;
        })(),
        // 设置键值 key 对应的数据值为 value
        set: (function() {
            return storage.setItem ? function(key, value) {
                try {
                    return storage.setItem(key, JSON.stringify(value));
                } catch (e) {
                    return void 0;
                }
            } : EmplyFunc;
        })(),
        // 移除键值 key 对应的数据项
        remove: (function() {
            return storage.removeItem ? function(key) {
                return storage.removeItem(key);
            } : EmplyFunc;
        })(),
        // 清除数据
        clear: (function() {
            return storage.clear ? function() {
                return storage.clear();
            } : EmplyFunc;
        })()
    } : EmplyStorage;
}

// 获取当前时间
function now() {
    return new Date().getTime();
}

// Storage 对象 和 本地缓存
var ls = createStorage('localStorage'),
    ss = createStorage('sessionStorage'),
    useCache = false,
    cache = {};

// 检查数据是否超时，如果超时，删除数据。
// 同时将可用数据加入本地缓存，方面以后获取
function checkExpires() {
    var time = now(),
        i, len, key, value;
    for (i = 0, len = ls.size(); i < len; i++) {
        key = ls.key(i);
        value = ls.get(key);
        if (value && key !== BASETAG) {
            if (value.expires > 0 && value.createTime + value.expires < time) {
                ls.remove(key);
            } else {
                cache[key] = value.data;
            }
        }
    }
}

// 主方法
var yStorage = function(key, value, time) {
    var argsNum = arguments.length,
        data = null;
    // 一个参数时，是获取数据
    if (argsNum === 1) {
        // 检查 key 是否在本地缓存里，如果在直接返回
        if (useCache && key in cache) {
            data = cache[key];
        } else {
            data = ss.get(key) || (function() {
                var tmp = ls.get(key);
                if (tmp) {
                    // 判断数据是否可用（未超时），如果可用，返回，否则删除
                    if (tmp.expires === 0 || (tmp.createTime + tmp.expires > now())) {
                        return tmp.data;
                    }
                    ls.remove(key);
                }
                return null;
            })();
            cache[key] = data;
        }
        return data;
    } else if (argsNum > 1) { // 参数大于1，则肯定是变更操作
        // value值是 undefined 或者 null，都是删除此键值对
        if (value === void 0 || value === null) {
            delete cache[key];
            return ss.remove(key) || ls.remove(key);
        } else {
            // 将值存入缓存
            cache[key] = value;
            time = time || 0;
            // 时间等于 -1， 则存入 SessionStorage
            if (time === -1) {
                return ss.set(key, value);
            } else {
                // 存入 localStorage
                return ls.set(key, {
                    data: value,
                    createTime: now(),
                    expires: time
                });
            }
        }
    }
};

yStorage.setCache = function(bool) {
    useCache = !!bool;
};

// 清除数据
yStorage.clear = function() {
    var info = ls.get(BASETAG);
    ss.clear();
    ls.clear();
    ls.set(BASETAG, info);
};

// 初始化操作（非必须）
yStorage.init = function(version) {
    var info = ls.get(BASETAG) || {},
        culVersion = info.version,
        lastCheckTime = info.cTime,
        changed = false;
    // 判断版本是否相同，如果不同则清空 localStorage
    if (!culVersion || culVersion !== version) {
        changed = true;
        ls.clear();
        culVersion = version;
    }
    // 检查后一次 cheak 时间，如果超过设置时间，而进行一次 check
    if (!lastCheckTime || now() - lastCheckTime > INTERVAL) {
        changed = true;
        checkExpires();
        lastCheckTime = now();
    }
    if (changed) {
        ls.set(BASETAG, {
            version: culVersion,
            cTime: lastCheckTime
        });
    }
};
