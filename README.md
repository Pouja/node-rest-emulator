# Node rest emulator
A simple stand alone mock/emulator server that uses [rest-emulator](https://github.com/temrdm/rest-emulator).
It serves a static file server which uses json to configure the rest responses.

# Installation
`npm install node-rest-emulator`

# Usage
Since I created it for my frontend websites which need to mock rest repsonses you can only use it directly or through package.json.

For example `npm run mock-server` with your package.json: 
```json
"scripts": {
  "mock-server": "mock-server config.json"
}
```

If there is any interest I will make it exportable, so you can use codewise.
## Configuration
```js
{
    port: 3000,
    // The directory where all the mock files are (json only), it will traverse the directory recursively
    dir: '/mocks',
    // An array of directories to serve static files
    root: ['./'],
    corsEnable: true,    
    // If set to true it will serve rewriteTemplate for 'GET /' requests
    rewriteNotFound: false,
    rewriteTemplate: 'index.html',
    // Custom headers to set for every rest response
    headers: {}
};
```
## Example json file
```json
{
    "/api/users": {
        "GET": {
            "default": {
                "data": [{
                    "name": "John"
                }, {
                    "name": "Adam"
                }],
                "code": 200,
                "timeout": 0
            },
            "blank": {
                "data": [],
                "code": 200,
                "timeout": 0,
                "headers": {
                    "ETag": "12345"
                }
            },
            "increase": {
                "data": [{
                    "name": "John"
                }, {
                    "name": "Adam"
                }, {
                    "name": "Clark"
                }, {
                    "name": "Earl"
                }],
                "code": 200,
                "timeout": 0
            }
        },
        "POST": {
            "default": {
                "data": {
                    "success": true
                },
                "code": 201
            },
            "error": {
                "code": 405
            }
        }
    },
    "/api/cities": {
        "GET": {
            "data": [{
                "name": "New York"
            }, {
                "name": "Miami"
            }],
            "query": {
                "name=Miami": {
                    "data": [{
                        "name": "Miami"
                    }]
                },
                "name=New York": {
                    "data": [{
                        "name": "New York"
                    }]
                }
            }
        }
    }
}
```

For more information see [gulp-rest-emulator](https://github.com/temrdm/gulp-rest-emulator) and [rest-emulator](https://github.com/temrdm/rest-emulator)
