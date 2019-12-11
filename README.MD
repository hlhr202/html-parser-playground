This is just a showcase, not fully implemented

Example parse the following tokens from

```html
<div class="name" style="color: red;">
    123
    <span>234</span>
    <input type="input" autofocus></input>
</div>
```

to

```json
{
    "nodeType": 0,
    "parsingStatus": 6,
    "tagName": "div",
    "children": [
        "123",
        {
            "nodeType": 0,
            "parsingStatus": 6,
            "tagName": "span",
            "children": [
                "234"
            ],
            "attributes": []
        },
        {
            "nodeType": 0,
            "parsingStatus": 6,
            "tagName": "input",
            "children": [],
            "attributes": [
                {
                    "key": "type",
                    "value": "input"
                },
                {
                    "key": "autofocus",
                    "value": true
                }
            ]
        }
    ],
    "attributes": [
        {
            "key": "class",
            "value": "name"
        },
        {
            "key": "style",
            "value": "color: red;"
        }
    ]
}
```