import { exec, spawn } from "child_process";
import { ethers } from "hardhat";
import { ContractInfo, Abi } from "../types/types"

namespace Verification {
    const File = require("./File");
    let Text = require("./Text");
    const fs = require("fs");
    const allFiles = require("../contracts.conf.json");
    const contractsPath = "./contracts"
    let contracts = allFiles["0.8.17"];
    class Verification {
        static deps: string[];
        static getBuildInfo(contract: string): any {
            let rawData = fs.readFileSync(`artifacts/contracts/${contract}.sol/${contract}.dbg.json`);
            let buildData = JSON.parse(rawData);
            rawData = fs.readFileSync(`artifacts/${buildData.buildInfo.slice(6, buildData.buildInfo.length)}`)
            return JSON.parse(rawData);
        }

        static genStandardInput() {
            let rawData = fs.readFileSync('verification.config.json');
            let contractsToVerify = JSON.parse(rawData);
            let verifyData: any = {
                language: "",
                sources: {},
                settings: {}
            }
            for (let i = 0; i < contractsToVerify.length; i++) {
                const buildInfo = this.getBuildInfo(contractsToVerify[i].contract);
                verifyData.language = buildInfo.input.language
                for (let d = 0; d < contractsToVerify[i].deps.length; d++) {
                    verifyData.sources[`${contractsToVerify[i].deps[d]}`] = buildInfo.input.sources[contractsToVerify[i].deps[d]];
                }
                verifyData.settings = {
                    optimizer: buildInfo.input.settings.optimizer,
                    outputSelection: {
                        "*": {
                            "*": [
                                "evm.gasEstimates"
                            ]
                        }
                    }
                }
                File.generateFile(`artifacts/contracts/${contractsToVerify[i].contract}.sol/${contractsToVerify[i].contract}.verify.json`, JSON.stringify(verifyData, null, 2))
                verifyData.sources = {}
            }
        }
        static async generateVerification() {
            let allContractDeps: any[] = []
            for (let i = 0; i < contracts.length; i++) {
                let contractFile = contracts[i] + ".sol"
                allContractDeps.push(await this.getContractDeps(contractFile, contractsPath));
            }
            let ranContracts = [];
            for (let i = 0; i < allContractDeps.length; i++) {
                for (let j = 0; j < allContractDeps[i].deps.length; j++) {
                    let contractFile: any = Text.afterLastIdentifier(allContractDeps[i].deps[j], "/");
                    let contract = contractFile.replace(".sol", "");
                    if (ranContracts.indexOf(contract) == -1) {
                        ranContracts.push(contract);
                        let foundDeps = allContractDeps.filter((element) => { return element.contract == contract })
                        if (foundDeps.length == 0) {
                            let contractPath: string = Text.beforeLastIdentifier(allContractDeps[i].deps[j], "/");
                            let contractDeps = await this.getContractDeps(contractFile, contractPath)
                            allContractDeps.push(contractDeps)
                        }
                    }
                }
            }
            this.composeDeps(allContractDeps);
        }
        static async getContractDeps(contractFile: string, contractPath: string) {
            this.deps = [];
            const getContractDeps = new Promise((resolve, reject) => {
                exec(`npx surya parse ${contractPath}/${contractFile} --json true`, (error: any, stdout: string, stderr: any) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    let contractData = JSON.parse(stdout);
                    console.log(contractFile)
                    let importedContracts = contractData.children.filter((element: any) => { return element.type == "ImportDirective" })
                    let contract = contractFile.replace(".sol", "");
                    let deps = [];
                    for (let i = 0; i < importedContracts.length; i++) {
                        let importedContract = Text.goBackOnPath(`${contractPath}/${importedContracts[i].path}`)
                        importedContract = Text.replacer(importedContract, [{ from: "./", to: "" }])
                        deps.push(importedContract);
                    }
                    resolve({ contract, deps });
                });
            });
            return await getContractDeps;
        }
        static composeDeps(allContractDeps: any) {
            let verificationContracts = allContractDeps;
            for (let i = 0; i < verificationContracts.length; i++) {
                verificationContracts[i].deps.push(`contracts/${verificationContracts[i].contract}.sol`)
                for (let j = 0; j < verificationContracts[i].deps.length; j++) {
                    let contract = verificationContracts[i].deps[j]
                    contract = Text.afterLastIdentifier(contract, "/").replace(".sol", "");
                    let subContract = verificationContracts.filter((element: any) => { return element.contract == contract });
                    if (subContract.length == 1 && subContract[0].deps) {
                        for (let k = 0; k < subContract[0].deps.length; k++) {
                            let bothContracts = verificationContracts[i].deps.filter((element: any) => { return element == subContract[0].deps[k] })
                            if (bothContracts.length == 0) {
                                verificationContracts[i].deps.push(subContract[0].deps[k])
                            }
                        }
                    }
                }
            }
            let mainVerificationContracts: string[] = []
            contracts.forEach((contract: any) => {
                mainVerificationContracts.push(verificationContracts.filter(((element: any) => { return element.contract == contract }))[0]);
            })
            File.generateFile("verification.config.json", JSON.stringify(mainVerificationContracts, null, 2))
        }
        
        static async executeCompilation(args:string):Promise<any>{
            let compilationOutput = new Promise((resolve, reject) => {
                exec(`solc ${args}`, (error: any, stdout: string, stderr: any) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    resolve(stdout);
                });
            });
            return await compilationOutput;
        }

        static async getContractGasCost( contractName: string):Promise<string>{
           let contractGasCost =  new Promise((resolve, reject) => {
                exec(`solc --standard-json < artifacts/contracts/${contractName}.sol/${contractName}.verify.json`, (error: any, stdout: string, stderr: any) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    let solcOut = JSON.parse(stdout);
                    let gasEstimates = solcOut.contracts[`contracts/${contractName}.sol`][contractName].evm.gasEstimates;
                    resolve(gasEstimates);
                });
            });
            return <string>(await contractGasCost);
        }

        static async genContractsInfo() {
            let path = "out/contractInfo/";
            let tempPath = "out/temp/";
            File.createDir(path);
            File.createDir(tempPath);
            for (let i = 0; i < contracts.length; i++) {
                await this.executeCompilation(`--optimize --optimize-runs=200 --abi --bin --overwrite contracts/${contracts[i]}.sol -o ${tempPath}`);
                let gasEstimates:string = await this.getContractGasCost(contracts[i]);
                const buildInfo = this.getBuildInfo(contracts[i]);
                let output = buildInfo.output.contracts[`contracts/${contracts[i]}.sol`][contracts[i]]
                let sources = buildInfo.output.sources[`contracts/${contracts[i]}.sol`]
                let compiler = { name: "solc", version: <string>buildInfo.solcLongVersion }
                let contractInfo: ContractInfo = {
                    contractName: contracts[i],
                    abi: output.abi,
                    metadata: output.metadata,
                    bytecode: output.evm.bytecode.object,
                    deployedBytecode: output.evm.deployedBytecode.object,
                    sourceMap: output.evm.bytecode.sourceMap,
                    deployedSourceMap: output.evm.deployedBytecode.sourceMap,
                    compiler,
                    ast: sources.ast,
                    functionHashes: output.evm.methodIdentifiers,
                    gasEstimates
                }
                File.move(`${tempPath}/${contracts[i]}.abi`,`${path}/${contracts[i]}.abi`)
                File.move(`${tempPath}/${contracts[i]}.bin`,`${path}/${contracts[i]}.bin`)
                File.generateFile(`out/contractInfo/${contracts[i]}.json`, JSON.stringify(contractInfo, null, 2))
            };
        }
    }
    module.exports = Verification;
}