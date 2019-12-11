import Parser, { DOMNode } from "./parser";

const htmlStr = `
    <div class="name" style="color: red;">
        123
        <span>234</span>
        <input type="input" autofocus></input>
    </div>
`;
const parser = new Parser(htmlStr);
const ast = parser.parseAST();
console.log(JSON.stringify(ast) + "\n");

const dfs = (root: DOMNode | string) => {
    if (typeof root !== "string") {
        console.log(root);
        console.log("\n");
        root.children.forEach(c => dfs(c));
    }
};
dfs(ast ?? "");
