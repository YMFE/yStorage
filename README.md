## yStorage —— 完善的本地存储封装

本地存储组件，封装`localStorage`和`sessionStorage`，支持缓存，支持数据项存在时长。

### API

#### 主方法 `yStorage`

```js
yStorage(key, value, time);
```

* 如果只有 **一个参数** 时，为`get`方法；如果 **多个参数** 时，为`set`方法。
* 第二个参数 `value` 支持任何类型的值。
* `value` 为 `undefined` 或 `null` 为删除操作。
* `time` 为存储时间，
  * `-1` 表示仅存在会话里（sessionStorage）；
  * `0` 或没有此参数，表示永久存储；
  * 其他数值，表示存储的时间，超过后，会被删除。

#### 清除方法 `yStorage.clear`

```js
yStorage.clear();
```

* 清除所有数据

#### 配置方法 `yStorage.init`

```js
yStorage.init(version);
```

* 此方法在于优化相关业务逻辑，如果只做一个库来用，那么可以不关心此方法。
* 参数`version`为当前业务前端代码版本号，如果版本号更改了，那么会自动清除所有数据（代码变了，存储的数据的结构可能会影响到代码，代码要做兼容，因此清除数据，避免此麻烦）
* 在`init`过程中，会自动检查是否到该清理数据的时间，如果到了，那么会去清理无效数据。

### 相关问题

* 为了减少调用storage的API次数，组件中包含缓存Cache。
  * 取数据，如果Cache内存在，则从Cache里获取。
  * 取数据，仅从storage获取数据的第一次，会判断是否超时，之后，从Cache里获取的，不会检查超时。
