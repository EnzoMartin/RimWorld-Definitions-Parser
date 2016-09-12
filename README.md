RimWorld Definitions Parser
=======================

A RimWorld XML parser, reads all the XML files found in the `Core` directory in the game's `Mods` and spits out JS modules in the `dist` directory

##Install

* Download and install the latest [NodeJS]
* Follow the [Node Gyp setup guide]
* `npm i rimworld-definitions-parser --save-dev`

##Usage

### CLI
```shell
node app.js "C:\Program Files (x86)\Steam\steamapps\common\RimWorld"
```

###NodeJS
```
const parser = require('rimworld-definitions-parser');
parser('C:\Program Files (x86)\Steam\steamapps\common\RimWorld);
```

## License

The MIT License (MIT)

Copyright (c) 2016 Enzo Martin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[Node Gyp setup guide]:https://github.com/TooTallNate/node-gyp#installation
[NodeJS]:https://nodejs.org/
