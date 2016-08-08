import {User} from '../sqldb'

export default function(io, app) {
  app.sockets = {};
  app.socket = io;
  io.on('connection', function(socket){
    if(socket.request.session.passport && socket.request.session.passport.user) {
      User.find({
        where: {
          _id: socket.request.session.passport.user
        }
      }).then((user) => {
        socket.join('user' + user._id);
        var lastSent = Date.now()
        app.sockets[user._id] = socket;
        socket.emit('identify', socket.request.session.passport.user);
        socket.on('chatMessage', function(msg) {
          let tags = user.get('tags') || '';
          if(tags.split(',').indexOf('admin') > -1) {
            if(msg.startsWith('!ban')) {
              let args = msg.split(' ').slice(1);
              User.find({
                where: {
                  steamid: args[0]
                }
              }).then((userToBan) => {
                userToBan.set('banned', new Date(Date.now() + parseInt(args[1]) * 1000));
                io.emit('notify', {message: "System: " + userToBan.personaname + " was banned for " + parseInt(args[1]) + " seconds!", level: 'success'});
                io.emit('chatMessage', {message: userToBan.personaname + " was banned for " + parseInt(args[1]) + " seconds!", user: user})
                userToBan.save();
              })
            } else if(msg.startsWith('!announce')) {
              let args = msg.substr(9)
              io.emit('notify', {message: "<b>Announcement: </b> " + args, level: 'success'});
            } else if(msg.startsWith('!trivia')) {
              var words = msg.split(' ').length;
              let question = "";
              for(var i = 1; i < words; i++){
                  question = question + msg.split(' ')[i] + " ";
              }
              io.emit('chatMessage', {message: "Trivia starting in...", user: user});
              var index = 5;
              let starting = setInterval(() => {
                io.emit('chatMessage', {message: index + "...", user: user});
                if(index === 1) {
                  clearInterval(starting);
                  setTimeout(() => {
                    io.emit('chatMessage', {message: question, user: user});
                  }, 1000);
                } else {
                  index -= 1;
                }
              }, 1000);

            } else {
              io.emit('chatMessage', {message: msg, user: user});
            }
          } else if(user.banned < Date.now()) {
            if(msg.length < 256 && /(c[o0]d[e3])|(c[o0]m)|(r[e3]f[e3]rr[a4]l)|(\?r[e3]f)/.test(msg.toLowerCase()) === false && (lastSent + 2000) < Date.now()) {
              io.emit('chatMessage', {message: msg, user: user});
              lastSent = Date.now();
            } else {
              socket.emit('chatMessage', {message: "Please do not send chat messages too quickly!", user: user});
            }
          } else {
            socket.emit('chatMessage', {message: "You are banned for " + (Date.now() - user.banned) / 1000 + " more seconds!", user: user});
          }
        })
      })
    }
  });
}
