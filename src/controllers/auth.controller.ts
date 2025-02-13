import config from '../config/auth.config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import Role, { IRole, IRoleOut } from '../models/role.model';
import swaggerDocs from "../swagger/authentication.json"


const signup = async (req: Request, res: Response, next: NextFunction) => {

  const { username, password, pat, devOpsDisplayName, devOpsUsername, xApiKey } = req.body;

  const roles = await getRoles(req.body.roles, res);


  const user = new User({ username, password: bcrypt.hashSync(password, 8), pat, devOpsDisplayName, devOpsUsername, xApiKey, roles: roles.map(rol => rol._id) });

  return user.save()
    .then(user => {
      res.status(201).json({
        user: {
          id: user._id,
          username: user.username,
          email: user.username,
          pat: user.pat,
          devOpsDisplayName: user.devOpsDisplayName,
          devOpsUsername: user.devOpsUsername,
          xApiKey: user.xApiKey,
          roles: roles.map(role => role.name)
        }
      })


    })
    .catch((error) => res.status(500).json({ error }))

};
const signin = (req: Request, res: Response, next: NextFunction) => {
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User Not found." });
      }
      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }
      var authorities = [];
      for (let i = 0; i < (user.roles as IRole[]).length; i++) {
        //@ts-ignore  please make good use of typescript here
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }

      var token = jwt.sign({
        id: user._id,
        username: user.username,
        email: user.email,
        pat: user.pat,
        devOpsDisplayName: user.devOpsDisplayName,
        devOpsUsername: user.devOpsUsername,
        xApiKey: user.xApiKey,
        roles: authorities,
      }, config, {
        expiresIn: 72000,
      });

      res.status(200).json({
        id: user._id,
        username: user.username,
        email: user.username,
        pat: user.pat,
        devOpsDisplayName: user.devOpsDisplayName,
        devOpsUsername: user.devOpsUsername,
        xApiKey: user.xApiKey,
        roles: authorities,
        accessToken: token
      });
    });

};
const updateUser = async (req: Request, res: Response, next: NextFunction) => {

  var query = { '_id': req.params.id };
  if (!!req.body.roles) {
    req.body.roles = (await getRoles(req.body.roles, res)).map(rl => rl._id)
  }

  User.findOneAndUpdate(
    query,
    { $set: { ...req.body } },
    { new: true }
  )
    .populate("roles")
    .exec()
    .then(user => user ?
      res.status(201).json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          pat: user.pat,
          devOpsDisplayName: user.devOpsDisplayName,
          devOpsUsername: user.devOpsUsername,
          xApiKey: user.xApiKey,
          roles: (user.roles as IRole[]).map(role => role.name)
        }
      }) : res.status(404).json({ message: 'No User found' }))
    .catch((error) => res.status(500).json({ error }))

}

const getSchema = async (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);

}

async function getRoles(roles: String[] = [], res: Response) {
  let results: IRoleOut[] = [];
  if (roles.length) {
    await Role.find({ name: { $in: roles } })
      .then((roles) => {
        results = roles;
      })
      .catch((error) => {
        res.status(500).json({ error })
      })
  } else {
    await Role.find({ name: "user" })
      .then((role) => {
        results = role;
      })
      .catch((error) => {
        res.status(500).json({ error })
      })
  }

  return results;

}
export { signin, signup, updateUser, getSchema };