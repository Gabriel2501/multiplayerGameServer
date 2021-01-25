const userManager = () => {
    let users;
    let adminUser;

    const clear = () => {
        users = Array(0);
    };

    const getUsers = () => users;

    const setAdminUser = (username) => {
        adminUser = username;
    };

    const getAdminUser = () => adminUser;

    const addUser = user => {
        users.push(user);
    };

    const removeUser = username => {
        users = users.filter(user => user !== username);
    }

    clear();

    return {
        clear, getUsers, addUser, removeUser, setAdminUser, getAdminUser
    };
};

module.exports = userManager;