import UserDTO from "../../src/dto/User.dto.js";
import {describe, it} from "mocha";
import {expect} from "chai";
import { generateUser } from "../../src/mocks/userMocks.js";
import { logger } from "../../src/utils/logger.js";

describe("UsersDTO test", async function () {
    this.userMock;
    
    before(async function () {
        this.userMock = await generateUser();
    });

    it("User DTO test", async function () {
        logger.info("Iniciando UserDTO test");
        let resultado = UserDTO.getUserTokenFrom(this.userMock)

        expect(resultado).to.has.property("name").and.to.be.eq(`${this.userMock.first_name} ${this.userMock.last_name}`);
        expect(resultado).to.has.property("role").and.to.be.equal(this.userMock.role);
        expect(resultado).to.has.property("email").to.be.eq(this.userMock.email)
    });
})