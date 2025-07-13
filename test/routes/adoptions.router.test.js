import { expect } from "chai";
import { after, describe, it, before } from "mocha";
import supertest from "supertest";
import mongoose, { isValidObjectId } from "mongoose";
import {generatePet} from "../../src/mocks/petMocks.js";
import { generateUser } from "../../src/mocks/userMocks.js";
import { logger } from "../../src/utils/logger.js";
import { connectDBtest } from "../utils/utils_test.js";

process.loadEnvFile("./src/config/.env.test")
const requester = supertest(`http://localhost:${process.env.PORT}`);

describe("Adoptions router TEST", async function () {
    this.timeout(10_000);
    this.pet;
    this.user;
    this.userId;
    this.petId;
    this.adoptionId;

    before(async function () {
        try {
            await connectDBtest(process.env.MONGO_URL);
            this.pet = generatePet();
            this.user = await generateUser();
            logger.info("COMENZANDO CICLO DE TEST")
        } catch (error) {
            logger.error("ADOPTIONS ROUTER test Error - before", error)
        };
    });
    after(async function () {
        try {
            await mongoose.connection.collection("adoptions").deleteMany();
            await mongoose.connection.collection("users").deleteMany();
            await mongoose.connection.collection("pets").deleteMany();
            await mongoose.connection.close();   
            logger.info("CICLO DE TEST FINALIZADO")
        } catch (error) {
            logger.error("PETS ROUTER test error - after", error)
        };
    });

    describe("Creating user and pet", async function () {
        it("Create User", async function () {
        let {body, status} = await requester.post("/api/sessions/register").send(this.user);

        expect(status).to.be.eq(200);
        expect(body).to.has.property("payload").and.to.be.a("string");
        expect(isValidObjectId(body.payload));
        this.userId = body.payload
        });
        it("Create Pet", async function () {
            let {body, status} = await requester.post("/api/pets").send(this.pet);

            expect(status).to.be.eq(201);
            expect(body).to.has.property("status").and.to.be.a("string").and.to.be.eq("success");
            expect(body).to.has.property("payload").and.to.be.an("object");
            expect(body.payload).to.has.property("_id")

            this.petId = body.payload._id
        });

        describe("Generate adoption TEST", async function () {
            it("Test /api/adoptions - method POST - createAdoption", async function () {
                let {body, status} = await requester.post(`/api/adoptions/${this.userId}/${this.petId}`)

                expect(status).to.be.eq(201);
                expect(body).to.has.property("status").and.to.be.a("string").and.to.be.eq("success");
                expect(body).to.has.property("message").and.to.be.a("string").and.to.be.eq("Pet adopted");
                expect(body).to.has.property("adoptId").and.to.be.a("string");
                expect(isValidObjectId(body.adoptId)).to.be.true;

                this.adoptionId = body.adoptId
            });
            it("Test /api/adoptions - method GET - getAdoption", async function () {
                let {body, status} = await requester.get(`/api/adoptions/${this.adoptionId}`);

                expect(status).to.be.eq(200);
                expect(body).to.has.property("status").and.to.be.a("string").and.to.be.eq("success");
                expect(body).to.has.property("payload").and.to.be.an("object");
                expect(body.payload).to.has.property("_id").and.to.be.a("string").and.to.be.eq(this.adoptionId);
                expect(body.payload).to.has.property("owner").and.to.be.a("string").and.to.be.eq(this.userId);
                expect(body.payload).to.has.property("pet").and.to.be.a("string").and.to.be.eq(this.petId);
            });
            it("Test /api/adoptions - method GET - getAllAdoptions", async function () {
                let {body, status} = await requester.get("/api/adoptions")

                expect(status).to.be.eq(200);
                expect(body).to.has.property("status").and.to.be.a("string").and.to.be.eq("success");
                expect(body).to.has.property("payload").and.to.be.an("array");
                expect(Array.isArray(body.payload)).to.be.true;
                body.payload.forEach(adoption => {
                    expect(adoption).to.has.property("_id").and.to.be.a("string");
                    expect(isValidObjectId(adoption._id)).to.be.true;
                    expect(adoption).to.has.property("owner").and.to.be.a("string");
                    expect(adoption).to.has.property("pet").and.to.be.a("string");
                    expect(adoption).to.has.property("__v").and.to.be.a("number");
                });
            })
        });
    });
});