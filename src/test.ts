class Test {
    [x: string]: any;

    private _attributes: Record<string, any>;
    public age = 20;

    constructor() {
        this._attributes = {};

        return new Proxy(this,  {
            get(target: any, prop: string) {
                if (prop in target) {
                  return target[prop];
                }
                return target._attributes[prop];
              },
              set(target, prop, value) {
                if (prop in target) {
                  target[prop] = value;
                } else {
                  target._attributes[prop] = value;
                }
                return true;
              }
        });
    }

    output() {
      console.log("This is output");
    }

    getAttributes() {
        return this._attributes;
    }
}

const TestProxy = (new Proxy(Test, {
  construct(target: any, arg: any[]) {
    const newInstance = new target();
    console.log(newInstance.age);
    return newInstance;
  }
}));

class Child extends TestProxy {
  public age: number = 50;
}

const a = new Child();
