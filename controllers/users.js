import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';

const generateToken = (data, secret) => jwt.sign(data, secret, { expiresIn: '1800s' });

export const signUp = asyncHandler(async (req, res) => {
  const {email, password } = req.body;
  if (!email || !password)
    throw new ErrorResponse('Name, email and password are required', 400);
  const found = await User.findOne({ email });
  if (found) throw new ErrorResponse('Email is already taken', 403);
  const hashPassword = await bcrypt.hash(password, 5);
  const {_id} = await User.create({ email, password: hashPassword });
  const newProfile = await Profile.create({
    user: _id,
    firstname: "",
    lastname: "",
    address:
    {
      city: "",
      street: "",
      housenr: "",
      zipcode: "",
      country: "",
    }, contact: {
      phone: "",
      email: "",
      git: "",
      linkedin: ""
    }, details: {dateofbirth: "",
    jobtitle: ""},
    personalstatement: "",
    photo: ""
  })
  const updatedProfile = await User.findOneAndUpdate(
    { _id },
    {profile: newProfile._id},
    { new: true }
);
  const token = generateToken({ _id }, process.env.JWT_SECRET);
  res.status(200).json({ token });
});

export const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ErrorResponse('Email and password are required', 400);
  const found = await User.findOne({ email }).select('+password');
  if (!found) throw new ErrorResponse('User does not exist', 404);
  const match = await bcrypt.compare(password, found.password);
  if (!match) throw new ErrorResponse('Password is not correct', 401);
  const token = generateToken({ _id: found._id }, process.env.JWT_SECRET);
  res.status(200).json({ token });
});

export const getUserInfo = asyncHandler(async (req, res) => res.status(200).json(req.user));