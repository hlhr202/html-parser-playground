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

export class DOMNode implements IGenericNode {
    nodeType = NodeType.DOMNode;
    parsingStatus = ParsingStatus.NULL;
    tagName = "";
    children: any[] = [];
    attributes: { key: string; value?: string | boolean }[] = [];
}

export default class Parser {
    private stringArr: string[] = [];
    private stack: DOMNode[] = [];
    astRoot: DOMNode | null = null;

    constructor(str: string) {
        this.stringArr = str.trim().split("");
    }

    public walk(walker: (currentNode: DOMNode | string) => void) {
        const dfs = (root: DOMNode | string) => {
            if (typeof root !== "string") {
                walker(root);
                root.children.forEach(c => dfs(c));
            } else {
                walker(root);
            }
        };
        if (this.astRoot) {
            dfs(this.astRoot);
        } else {
            console.log("Current ast is empty");
        }
    }

    public parseAST() {
        if (
            this.getNextToken() === "<" &&
            this.getNthToken(1).match(/[a-zA-Z]/)
        ) {
            this.astRoot = this.parseDOMNode();
            return this.astRoot;
        }
    }

    private getNextToken() {
        return this.getNthToken();
    }

    private getNthToken(n = 0) {
        return this.stringArr[n];
    }

    private getCurrentObject() {
        return this.stack[this.stack.length - 1];
    }

    private eat(num = 1) {
        const head = this.stringArr.splice(0, num);
        return head;
    }

    private parseDOMNode() {
        const processingObject = new DOMNode();
        this.stack.push(processingObject);
        while (
            this.getNextToken() &&
            this.getNextToken() !== "" &&
            this.getCurrentObject().parsingStatus !==
                ParsingStatus.CLOSE_TAG_STOP
        ) {
            switch (this.getNextToken()) {
                case "<":
                    {
                        if (this.getNthToken(1) === "/") {
                            this.parseCloseTag();
                        } else {
                            if (
                                this.getCurrentObject() &&
                                this.getCurrentObject().nodeType ===
                                    NodeType.DOMNode &&
                                (this.getCurrentObject().parsingStatus ===
                                    ParsingStatus.OPEN_TAG_STOP ||
                                    this.getCurrentObject().parsingStatus ===
                                        ParsingStatus.NODE_CONTENT_STOP)
                            ) {
                                const domNode = this.parseDOMNode();
                                this.getCurrentObject().children.push(domNode);
                            } else {
                                this.parseOpenTag();
                            }
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

    private parseOpenTag() {
        const currentObject = this.getCurrentObject();
        currentObject.parsingStatus = ParsingStatus.OPEN_TAG_START;
        let tagName: string[] = [];
        let isSelfClosingTag = false;
        while (this.getNextToken() && this.getNextToken() !== ">") {
            switch (this.getNextToken()) {
                case "<":
                    this.eat();
                    break;
                case " ":
                    if (this.getNthToken(1) !== "/") {
                        this.parseAttributes();
                    } else {
                        this.eat();
                    }
                    break;
                case "/": {
                    if (this.getNthToken(1) !== ">") {
                        throw "Open tag is not valid";
                    } else {
                        // self closing xml
                        this.eat();
                        isSelfClosingTag = true;
                    }
                    break;
                }
                default:
                    tagName.push(this.getNextToken());
                    this.eat();
                    break;
            }
        }
        this.eat();
        currentObject.tagName = tagName.join("");
        if (!isSelfClosingTag) {
            currentObject.parsingStatus = ParsingStatus.OPEN_TAG_STOP;
        } else {
            currentObject.parsingStatus = ParsingStatus.CLOSE_TAG_STOP;
        }
    }

    private parseAttributes() {
        const currentObject = this.getCurrentObject();
        let attrName: string[] = [];
        let attributes: { key: string; value?: string | boolean }[] = [];
        while (
            this.getNextToken() &&
            this.getNextToken() !== ">" &&
            this.getNextToken() !== "/"
        ) {
            switch (this.getNextToken()) {
                case " ":
                    this.eat();
                    if (attrName.length !== 0) {
                        attributes.push({
                            key: attrName.join(""),
                            value: true
                        });
                        attrName = [];
                    }
                    break;
                case "=":
                    {
                        this.eat();
                        if (attrName.length === 0) {
                            throw "Attribute value cannot be assigned to empty object";
                        } else if (
                            this.getNextToken() !== "'" &&
                            this.getNextToken() !== '"'
                        ) {
                            throw "Attribute value is not valid";
                        } else {
                            const value = this.parseAttributesValue();
                            attributes.push({ key: attrName.join(""), value });
                            attrName = [];
                        }
                    }
                    break;
                default: {
                    attrName.push(this.getNextToken());
                    this.eat();
                    break;
                }
            }
        }
        if (attrName.length !== 0) {
            attributes.push({ key: attrName.join(""), value: true });
            attrName = [];
        }
        currentObject.attributes = attributes;
    }

    private parseAttributesValue() {
        const terminator = this.eat()[0];
        let attrValue: string[] = [];
        while (this.getNextToken() && this.getNextToken() !== terminator) {
            attrValue.push(this.getNextToken());
            this.eat();
        }
        this.eat();
        return attrValue.join("");
    }

    private parseNodeContent() {
        const currentObject = this.getCurrentObject();
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

    private parseCloseTag() {
        const currentObject = this.getCurrentObject();
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
