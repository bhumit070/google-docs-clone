const io = require('socket.io')(4000, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
const mongoose = require('mongoose');
const Document = require('./models/schema');
const password = encodeURI('Bhum!t070');
const user = 'bhumit070';
const dbURL = `mongodb+srv://${user}:${password}@cluster0.tjoik.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
mongoose
  .connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('db connected');
  })
  .catch((error) => console.log(error));

const DefaultValue = '';

io.on('connection', (socket) => {
  socket.on('get-document', async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    const data = document === null ? '' : document.data;
    socket.emit('load-document', data);

    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

const findOrCreateDocument = async (id) => {
  if (!id) return null;
  try {
    const document = await Document.findById({ _id: id });
    if (document) return document;
    return await Document.create({ _id: id, data: DefaultValue });
  } catch (error) {
    console.log(error);
  }
};
