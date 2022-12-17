namespace genStandardJsonInput{
    let Contract = require("../models/Contract");
    async function main() {
        Contract.genStandardInput();
    }
    main();
}