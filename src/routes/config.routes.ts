import { createConfig, deleteConfigById, getConfiguration, updateConfig, getSchema } from "../controllers/config.controller";
import authJwt from '../middleware/authJwt';
import { checkConfigExisted, checkConfigNew, checkUserExist } from "../middleware/verifyConfig";


const configurationsRoute = function (app) {
    app.post("/api/configurations/create", [
        checkConfigNew,
        checkUserExist,
    ], createConfig);
    app.patch("/api/configurations/update",
        authJwt.verifyToken,
        updateConfig
    );
    app.get("/api/configurations/getConfigById/", getConfiguration);
    app.delete("/api/configurations/deleteConfigById/:userId", checkConfigExisted, deleteConfigById);
    app.get("/api/configurations", getSchema)
}

export { configurationsRoute };