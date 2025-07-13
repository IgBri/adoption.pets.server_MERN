import { createHash, passwordValidation } from "../../src/utils/index.js";
import { expect } from "chai";
import { describe, it } from "mocha";
import { logger } from "../../src/utils/logger.js";

describe("bcrypt functions test", async function () {
    this.validPassword;
    this.hashPassword;
    this.invalidPassword;
    this.user;

    before(async function () {
        this.validPassword = "123coder";
        this.invalidPassword = "456coder";
    })

    it("createhash() function test with password", async function () {
        logger.info("Iniciando test de funcion createHash()")
        this.hashPassword = await createHash(this.validPassword);
        this.user = {
            password: this.hashPassword
        }

        expect(this.hashPassword).not.to.be.eq(this.validPassword);
        expect(this.hashPassword.split("$")[1]).to.be.eq("2b")
        expect(this.hashPassword.split("$")[2]).to.be.eq("10")
    });
    it("passwordValidation() function test with invalid password to be error", async function () {
        logger.info("Iniciando test de funcion passwordValidation() con una contraseña invalida")
        let resultado = await passwordValidation(this.user, this.invalidPassword);

        expect(resultado).to.be.false;
    });
    it("passwordValidation() function test with valid password to be success", async function () {
        logger.info("Iniciando test de funcion passwordValidation() con una contraseña valida")
        let resultado = await passwordValidation(this.user, this.validPassword);
        expect(resultado).to.be.true
    });
});