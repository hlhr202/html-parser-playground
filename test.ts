import Parser, { DOMNode } from "./parser";

const walker = (node: DOMNode | string) => {
    if (typeof node === "string") {
        console.log(`Walking text node: '${node}'`);
        console.log("\n");
    } else {
        console.log(`Walking ${node.tagName} tag node`);
        console.log(`- attributes: ${node.attributes.length === 0 && "empty"}`);
        node.attributes.forEach(attr => {
            console.log(`  - ${attr.key}: ${attr.value}`);
        });
        console.log(`- children: ${node.children.length}`);
        console.log("\n");
    }
};

(() => {
    const normalCase1 = `
    <div class="name" style="color: red;">
        123
        <span>234</span>
        <input type="input" autofocus></input>
    </div>
    `;
    const parser = new Parser(normalCase1);
    const ast = parser.parseAST();
    console.log(JSON.stringify(ast) + "\n");
    parser.walk(walker);
})();

console.log("-------------------------");

(() => {
    const selfCloseTag = `
    <div>
        123
        <input type="text" autofocus />
    </div>
    `;
    const parser = new Parser(selfCloseTag);
    const ast = parser.parseAST();
    console.log(JSON.stringify(ast) + "\n");
    parser.walk(walker);
})();
