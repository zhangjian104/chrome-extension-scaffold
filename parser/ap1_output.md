# 编程相关笔记

# 服务端开发注意事项

尽量不要模块和接口耦合，影响面尽量缩小

# 调试

### Mac写代码Win调试

mac ip: 10.213.211.77

#### 异步阻塞

利用Promise的resolve函数执行后才会执行后面代码的原理，在等待某个时间后再执行resolve()，从而继续执行后续逻辑，达到主动阻塞任务的目的。

```typescript
async function waitForBooleanChange() {
  await new Promise(resolve => {
    // 将 resolve 函数存储在外部变量中
    resolveFunction = resolve;
  });
  console.log("111");
}
// 在外部调用resolveFunction()才会打印111
```

#### 事务

每个任务包装为三个阶段：准备阶段，提交阶段，回滚阶段。

- 准备阶段各自执行任务，如果全部执行成功，则走提交阶段。
- 提交阶段就是把执行后的结果应用到系统
- 如果准备阶段有一个失败，则走回滚阶段
- 回滚就是在之前定义好“当前状态”，调用回归从“执行后的状态”，回到“当前状态”

```typescript
// 参与者接口
interface Participant {
    prepare(): Promise<boolean>; // 准备阶段
    commit(): Promise<void>;     // 提交阶段
    rollback(): Promise<void>;    // 回滚阶段
}

// 具体参与者实现
class DatabaseParticipant implements Participant {
    async prepare(): Promise<boolean> {
        const success = Math.random() > 0.2;
        if (success) 
            return true;
         else 
            return false;
        }
    }
    async commit(): Promise<void> {
        console.log(`${this.name}: Committed.`);
    }
    async rollback(): Promise<void> {
        console.log(`${this.name}: Rolled back.`);
    }
}

// 协调者类
class Coordinator {
    async executeTransaction(): Promise<boolean> {
        const prepareResults = await Promise.all(this.participants.map(p => p.prepare()));
        const allPrepared = prepareResults.every(result => result);
        if (allPrepared) {
            await Promise.all(this.participants.map(p => p.commit()));
            return true;
        } else {
            await Promise.all(this.participants.map(p => p.rollback()));
            return false;
        }
    }
}

// 客户端测试代码
async function main() {
    // 创建两个参与者（如数据库DB1和DB2）
    const db1 = new DatabaseParticipant("DB1");
    const db2 = new DatabaseParticipant("DB2");

    // 创建协调者并关联参与者
    const coordinator = new Coordinator([db1, db2]);

    // 执行两阶段提交事务
    const success = await coordinator.executeTransaction();
    console.log(`Transaction result: ${success ? "Success" : "Failure"}`);
}

// 运行测试
main();
```

#### 同步事件/命令

全局的命令或者事件可以帮助解耦代码，但带来的是执行流程不清晰。比如先中断，再执行重试等后续流程，因为中断是抛出的事件，所以，前后没有顺序关系，可能导致顺序错乱。

```typescript
eventEmitterService.emit(CustomEvents.CancelRequest);
// 重试时需要先关闭请求，再重试
// 关闭请求需要做一些操作，所以使用使用延时器将两个时机错开
// 延时器丑陋，没解决本质问题
setTimeout(() => {
  eventEmitterService.emit(CustomEvents.RetryRequest);
}, 40);
```

一个想法是命令模式，发出命令必须等命令执行完成，才走下面的流程

或者同步事件，具体实现后面再说

#### 大任务分片执行

每次运行到此都交出主线程的控制权，等0延迟器生效，才继续执行后续的代码。以此类推。

```typescript
await new Promise((resolve) => setTimeout(resolve, 0));

// 例子，遍历所有页面子节点
async function traverseAndLogDom(node) {
  if (!node) return;
  // 遍历子节点
  let child = node.firstChild;
  while (child) {
    // 后续代码放到异步队列
    await new Promise((resolve) => setTimeout(resolve, 0));
    traverseAndLogDom(child);
    child = child.nextSibling;
  }
}

traverseAndLogDom(document.documentElement);

// 简单封装一下
function cedeMainControl() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
...
await cedeMainControl(); // 调用处插入
```

#### 闭包

使用闭包解决全局变量往重置的问题

```typescript
//惰性计算指的是如下方的3+4只有在真正调用时才会算表达式的值，也就是7
//javascript不支持惰性计算，所以在调用add函数时就会将3+4的值作为参数传进add函数的参数中
add(2, 4+3)
```

#### 函数式编程

函数式编程有以下几个特点：

- 描述映射：函数式编程并非描述解决问题的步骤，而是描述输入与输出的某种映射关系；
- 不可变量：函数式编程中没有所谓的“变量赋值”，只有“参数绑定”，一旦某个参数绑定了一个值，则不能被重新绑定；
- 无副作用：函数的输出只依赖于输入的参数，入参相同则返回值一定相同，函数运行过程中也不会对外界产生任何影响。
- 惰性求值：只有真正用到的值才需要被计算；
- 函数是一等公民：函数可以（甚至经常）作为另一个函数的参数和返回值，if 等语句也是函数；

# 数据结构

# 架构

内核跨平台+交互各端自行实现的模式

# 感想

组件内的状态是有意义的，可以有效的分摊系统数据的复杂度。

`store`作为数据源，下发给组件消费。

所以以前的类似游戏的这种全局下发数据快照，组件只做UI渲染的思路是偏激的，无法真正落地。

一个项目基本分三层就够了,底层的模型层,中间的交互层或者数据层,最上层的视图层。数据流应该是自底向上的，模型层的数据最稳定，最被动。视图层最灵活，最主动。

视图层应该按需取数据，下面的层依次提供数据。

系统之间最好不要有互相调用，为了良好的移植性，可以通过命令模式，通过接口来调用。

收到一个开发任务,先不着急推着做.先分析状态机,将核心逻辑理顺之后,再写demo原型和联调，demo务求简单&覆盖核心流程。全部跑通确认无盲点之后，再编写组件。

复杂的系统任务都可以通过良好的拆分，不断简化。所以无需惧怕或头痛。想清楚再写代码。

当一个问题处理时间过长时，不妨停下来处理其他问题。或者重新整理思路看看是不是方向错了。

编写一段逻辑时，需要考虑健壮性，数据变量是否重置，环境可能出现哪些变化，当前逻辑能否兼顾到这些情况

当一个任务状态复杂时，思考清楚再下手。找到最小最简单的状态，其他状态作为一个整体来对待。

```typescript
if( A ){}
else if( B ){}
else if( C ){}
else if( D ){}
...
能否写成
if( A ){}
else if( 其他状态 ){}
```

面向汇报干活儿。总之你就记住一个原则：当下存在哪些问题，你要去往哪里。这样你就不愁你的OKR写不出来了。

制定目标尽量贴合具体业务，提升业务价值，而不是盯着难点技术。

![]()![]()
增加性能埋点，提前想好性能指标

仔细确认需求文档，避免产生歧义

关于将模块优化作为版本迭代的必要流程固定下来的一些个人想法：

vscode等大型项目每次版本更新，发布的功能变更比较少，相对的，每个版本都会看到架构设计或者重要模块的优化，这里的优化既有性能的优化又有实现逻辑的优化。

我们业务上的代码虽然比不上vscode工程浩大，但面向的用户数以千万计，且承担了未来ai能力（客户端）拓荒者的角色，不能不重视。

鉴于此背景，因此我建议：

- 每次版本迭代时，允许、鼓励对既有代码做优化；
- 形成内部的惯例或制度；
- 重视设计方案，尤其重视内审，内审的方案应该更细，覆盖更多的边界情况。
- 内审的材料可以与公审的材料不一样，内审更关注难点模块的实现；
- 内审前需要将材料发给相关审核人，避免临场讲解产生歧义或覆盖不到边界情况；
    - 能实现，不代表最优。审核人可以提前帮助设计者做出判断或优化；

通过这些手段，项目代码与工程师共同成长，若干版本之后仍能保持优雅与健壮。

# 事件

| 事件名 | 解释 | 用法 |
| --- | --- | --- |
| Step | Step 事件是对象的一种事件，用于在每一帧更新对象的状态和逻辑，类似与update。<br/>在 Step 事件中，通常会包含对象的移动、碰撞检测、状态更新等逻辑。 |  |
| create | 在对象创建时触发，通常用于初始化对象的属性和状态。 |  |
| destroy | 在对象销毁时触发，通常用于清理对象占用的资源。 |  |
| **alarm** | 在定时器到达指定时间时触发，可以用于实现延时操作。`alarm` 函数在游戏开发中类似于 `sleep` 而不是 `setTimeout`，`sleep` 函数在程序中暂停执行一段时间。 | alarm[index] = -1来取消定时器 |
| **Collision** | 在对象发生碰撞时触发，可以用于处理碰撞后的逻辑 |  |
| **Mouse** | 包括鼠标按下、释放、移动等事件，用于处理鼠标交互操作 |  |
| **Keyboard ** | 包括按键按下、释放等事件，用于处理键盘输入操作。 |  |
| **Draw ** | 在每一帧绘制对象时触发，可以用于自定义对象的绘制逻辑。 |  |
| **Step Begin** | 分别在 Step 事件之前和之后触发，可以用于控制对象逻辑执行的顺序。 |  |
| **Step End** |  |  |

# Git与版本管理

### rebase

#### 多笔提交压成一笔提交

```shell
git rebase -i HEAD~2
将第二个提交（即b）的行的 pick 改为 squash 或 s
解决冲突
git add .
git rebase --continue
git push origin <branch-name> --force // 小心覆盖
```

# 多媒体工具

### 图片

```plaintext
magick '/Users/ankara/Desktop/57271744075569_.pic.jpg' -background none -fill "rgba(180,180,180,0.3)" \
-pointsize 24 -font "SimHei" label:"仅注册公司使用" -rotate -45 \
-write mpr:watermark +delete -size 60x60 tile:mpr:watermark -composite output.jpg
```

# GO语言