import bcrypt from "bcrypt";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const register = async (userData) => {
  const { email, password, role } = userData;

  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  // 2. Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Create User
  const user = await User.create({
    email,
    password: hashedPassword,
    role,
  });

  // 4. Generate JWT
  const token = generateToken(user._id);

  // 5. Return Response
  return {
    success: true,
    message: "User registered successfully",
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  };
};


export const login = async (userData) => {
    const { email, password } = userData;
  
    // 1. Check if user exists
    const user = await User.findOne({ email });
  
    if (!user) {
      throw new Error("Invalid Email or Password");
    }

    if (!user.emailVerified) {
        throw new Error("Please verify your email first.");
    }
  
    // 2. Check if account is active
    if (!user.isActive) {
      throw new Error("Your account has been blocked");
    }
  
    // 3. Compare Password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );
  
    if (!isPasswordCorrect) {
      throw new Error("Invalid Email or Password");
    }
  
    // 4. Update Last Login
    user.lastLogin = new Date();
    await user.save();
  
    // 5. Generate JWT
    const token = generateToken(user._id);
  
    // 6. Return Response
    return {
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    };
  };