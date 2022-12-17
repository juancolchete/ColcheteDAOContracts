namespace genInfoFile{
    const Contract = require("../models/Contract");
    async function main() {
        await Contract.generateVerification();
        await new Promise(r => setTimeout(r, 1000));
        Contract.genStandardInput();
        await new Promise(r => setTimeout(r, 1000));
        Contract.genContractsInfo();
    }
    main();
}