enum NodeType {
    DOMNode
}

enum ParsingStatus {
    NULL,
    OPEN_TAG_START,
    OPEN_TAG_STOP,
    NODE_CONTENT_START,
    NODE_CONTENT_STOP,
    CLOSE_TAG_START,
    CLOSE_TAG_STOP
}

interface IGenericNode {
    nodeType: NodeType.DOMNode;
}

class DOMNode implements IGenericNode {
    nodeType = NodeType.DOMNode;
    parsingStatus = ParsingStatus.NULL;
    tagName = "";
    children: any[] = [];
}

class Parser {
    stringArr: string[] = [];
    stack: any[] = [];

    constructor(str: string) {
        this.stringArr = str.trim().split("");
    }

    getNextToken() {
        return this.getNthToken();
    }

    getNthToken(n = 0) {
        return this.stringArr[n];
    }

    getCurrentObject<T>() {
        return this.stack[this.stack.length - 1] as T;
    }

    eat(num = 1) {
        const head = this.stringArr.splice(0, num);
        return head;
    }

    parseAST() {
        if (
            this.getNextToken() === "<" &&
            this.getNthToken(2).match(/[a-zA-Z]/)
        ) {
            return this.parseDOMNode();
        }
    }

    parseDOMNode() {
        const processingObject = new DOMNode();
        this.stack.push(processingObject);
        while (
            this.getNextToken() &&
            this.getNextToken() !== "" &&
            this.getCurrentObject<DOMNode>().parsingStatus !==
                ParsingStatus.CLOSE_TAG_STOP
        ) {
            switch (this.getNextToken()) {
                case "<":
                    if (this.getNthToken(1) === "/") {
                        this.parseCloseTag();
                    } else {
                        if (
                            this.getCurrentObject() &&
                            this.getCurrentObject<IGenericNode>().nodeType ===
                                NodeType.DOMNode &&
                            (this.getCurrentObject<DOMNode>().parsingStatus ===
                                ParsingStatus.OPEN_TAG_STOP ||
                                this.getCurrentObject<DOMNode>()
                                    .parsingStatus ===
                                    ParsingStatus.NODE_CONTENT_STOP)
                        ) {
                            const domNode = this.parseDOMNode();
                            this.getCurrentObject<DOMNode>().children.push(
                                domNode
                            );
                        } else {
                            this.parseOpenTag();
                        }
                    }
                    break;
                default:
                    this.parseNodeContent();
                    break;
            }
        }
        return this.stack.pop() as DOMNode;
    }

    parseOpenTag() {
        const currentObject = this.getCurrentObject<DOMNode>();
        currentObject.parsingStatus = ParsingStatus.OPEN_TAG_START;
        let tagName: string[] = [];
        while (this.getNextToken() && this.getNextToken() !== ">") {
            switch (this.getNextToken()) {
                case "<":
                    this.eat();
                    break;
                default:
                    tagName.push(this.getNextToken());
                    this.eat();
                    break;
            }
        }
        this.eat();
        currentObject.tagName = tagName.join("");
        currentObject.parsingStatus = ParsingStatus.OPEN_TAG_STOP;
    }

    parseNodeContent() {
        const currentObject = this.getCurrentObject<DOMNode>();
        currentObject.parsingStatus = ParsingStatus.NODE_CONTENT_START;
        let nodeContent: string[] = [];
        while (
            this.getNextToken() &&
            !(
                this.getNextToken() === "<" &&
                (this.getNthToken(1).match(/[a-zA-Z]/) ||
                    this.getNthToken(1) === "/")
            )
        ) {
            nodeContent.push(this.getNextToken());
            this.eat();
        }
        const parsedNodeContent = nodeContent.join("").trim();
        if (parsedNodeContent.length) {
            currentObject.children.push(parsedNodeContent);
        }
        currentObject.parsingStatus = ParsingStatus.NODE_CONTENT_STOP;
    }

    parseCloseTag() {
        const currentObject = this.getCurrentObject<DOMNode>();
        currentObject.parsingStatus = ParsingStatus.CLOSE_TAG_START;
        let tagName: string[] = [];
        while (this.getNextToken() && this.getNextToken() !== ">") {
            if (tagName.length >= currentObject.tagName.length)
                throw "Close tag does not matched the open tag";
            switch (this.getNextToken()) {
                case "<":
                    this.eat();
                    break;
                case "/":
                    this.eat();
                    break;
                default:
                    tagName.push(this.getNextToken());
                    this.eat();
                    break;
            }
        }
        this.eat();
        const tagNameStr = tagName.join("");
        if (tagNameStr !== currentObject.tagName)
            throw "Close tag does not matched the open tag";
        currentObject.parsingStatus = ParsingStatus.CLOSE_TAG_STOP;
    }
}

const htmlStr = `
    <div>
        123
        <span>234</span>
    </div>
`;

const parser = new Parser(htmlStr);

const dfs = (root: DOMNode | string) => {
    if (typeof root !== "string") {
        console.log(root);
        console.log("\n");
        root.children.forEach(c => dfs(c));
    }
};

const ast = parser.parseAST();

console.log(JSON.stringify(ast) + "\n");

dfs(ast ?? "");
