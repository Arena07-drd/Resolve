import User from '../models/User.js'

export async function listUsers(_request, response, next) {
  try {
    const users = await User.find().select('_id name email').sort({ name: 1 })

    return response.status(200).json({
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      })),
    })
  } catch (error) {
    return next(error)
  }
}

