namespace TextClass{
    class Text {
        static replacer(text:string, replaceConfig:any):string {
            for (let i = 0; i < replaceConfig.length; i++) {
                text = text.replaceAll(replaceConfig[i].from, replaceConfig[i].to);
            }
            return text;
        }
        static between(text:string, start:string, end:string):string {
            return text.substring(text.lastIndexOf(start) + 1, text.lastIndexOf(end));
        }
        static afterLastIdentifier(text:string, identifier:string):string{
            return text.slice(text.lastIndexOf(identifier) + 1);
        }
    
        static beforeLastIdentifier(text:string, identifier:string):string {
            return text.substring(0, text.lastIndexOf(identifier));
        }
    
        static goBackOnPath(path:string):string {
            let indexChar = path.indexOf("../");
            let lastBar = path.lastIndexOf("/", indexChar)
            let beforeLastBar = path.lastIndexOf("/", lastBar-1)
            path = path.replace(path.slice(beforeLastBar, lastBar + 3), "")
            if (indexChar === -1) {
                return path;
            }else{
                return this.goBackOnPath(path);
            } 
        }
    
        static indexOfNth(text:string, char:string, nth:number, fromIndex:number = 0):number {
            let indexChar = text.indexOf(char, fromIndex);
            if (indexChar === -1) {
                return -1;
            } else if (nth === 1) {
                return indexChar;
            } else {
                return this.indexOfNth(text, char, nth - 1, indexChar + 1);
            }
        }
    
        static beforeNthIdentifier(text:string, identifier:string, n:number):string {
            return text.substring(0, this.indexOfNth(text, identifier, n));
        }
    }
    module.exports = Text
}