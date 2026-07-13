import * as authService from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);

    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  export const getCurrentUser = async (req, res) => {

    res.status(200).json({

        success:true,

        user:req.user

    })

}