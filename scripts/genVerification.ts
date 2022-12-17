namespace genVerification{
    const Contract = require("../models/Contract"); 
    async function genVerification() {
        await Contract.generateVerification();
        await new Promise(r => setTimeout(r, 1000));
        Contract.genStandardInput();
    }
    genVerification();
}

