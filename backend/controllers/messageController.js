import Message from '../models/Message.js';
import User from '../models/User.js'; // Import User to fetch names

// @desc    Get messages for a user (either Admin or Recruiter)
// @route   GET /api/messages
export const getMessages = async (req, res) => {
  try {
    const { role, username, id } = req.user;
    let query;

    if (role === 'admin') {
      query = {
        $or: [
          { to: 'admin' },
          { from: 'admin' }
        ]
      };
    } else {
      query = {
        $or: [
          { to: id },
          { to: username },
          { to: 'all' },
          { from: id },
          { from: username }
        ]
      };
    }

    // Fetch messages
    const messages = await Message.find(query).sort({ createdAt: -1 });

    // Enhance messages with names by looking up IDs
    // Note: This is a manual populate because 'from'/'to' can be 'admin' string or ObjectId
    const enhancedMessages = await Promise.all(messages.map(async (msg) => {
      let fromName = msg.from;
      let toName = msg.to;

      // If 'from' looks like an ID, find the user
      if (msg.from !== 'admin' && msg.from.length === 24) {
        const user = await User.findById(msg.from).select('name');
        if (user) fromName = user.name;
      }

      // If 'to' looks like an ID, find the user
      if (msg.to !== 'admin' && msg.to !== 'all' && msg.to.length === 24) {
        const user = await User.findById(msg.to).select('name');
        if (user) toName = user.name;
      }

      return {
        ...msg.toObject(),
        fromName: fromName || msg.from,
        toName: toName || msg.to
      };
    }));

    res.json(enhancedMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message (Persist to DB)
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { to, subject, content } = req.body;
    const from = req.user.role === 'admin' ? 'admin' : req.user.id;

    const message = await Message.create({
      from,
      to,
      subject,
      content
    });
    
    // Add names for immediate frontend display
    let fromName = from;
    if(from !== 'admin') {
        const user = await User.findById(from);
        if(user) fromName = user.name;
    }

    res.status(201).json({ ...message.toObject(), fromName });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a message
// @route   PUT /api/messages/:id
export const updateMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only Admin or Sender can edit
    if (req.user.role !== 'admin' && message.from !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this message' });
    }

    message.subject = req.body.subject || message.subject;
    message.content = req.body.content || message.content;

    const updatedMessage = await message.save();
    res.json(updatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only Admin or Sender can delete
    if (req.user.role !== 'admin' && message.from !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();
    res.json({ message: 'Message removed', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};