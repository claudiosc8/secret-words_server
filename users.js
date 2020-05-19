const users = [];

const addUser = ({ id, name, room, spymaster}) => {

  room = room.trim().toLowerCase();

  if(!name) {
  	name = guestUser(room)
  } else {
  	name = name.trim().toLowerCase();
  }

  const existingUser = users.find((user) => user.room === room && user.name === name);

  if(!name || !room) return { error: 'Username and room are required.' };
  if(existingUser) return { error: 'Username is taken.' };

  const user = { id, name, room, spymaster };

  users.push(user);

  return { user };
}

const guestUser = (room) => {

	const usersInRoom = getUsersInRoom(room)

	let i = 1;
	while(usersInRoom.some(e => e.name === 'Guest'+i)) {
		i++
	}

	return 'Guest'+i
}

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if(index !== -1) return users.splice(index, 1)[0];
}

const getUser = (id) => users.find((user) => user.id === id);

const getAllUsers = () => users;

const getUsersInRoom = (room) => users.filter((user) => user.room === room);

module.exports = { addUser, removeUser, getUser, getUsersInRoom, getAllUsers };