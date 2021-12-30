async function getPreferenceList(user) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function getMatchedGroups() {
  const matchedGroups = [];
  this.orderedAllUserList.forEach(async (userA) => {
    if (this.assignedUsers.has(userA)) {
      return;
    }

    const preferenceList = await getPreferenceList(userA);
    const userB = preferenceList.find((user) => !this.assignedUsers.has(user));
    if (userB) {
      matchedGroups.push({ userA, userB });
      this.assignedUsers.add(userA);
      this.assignedUsers.add(userB);
    }
  });

  console.log('matchedGroups = ', JSON.stringify(matchedGroups, null, 2));

  return Promise.all(matchedGroups);
}

const allUsersortedByLastMeetingDate = [
  {
    firstname: 'Sakibul',
    lastname: 'Mowla',
    email: 'sakibulmowla@gmail.com',
    timestamp: '2022-01-21T00:00:00.000Z',
  },
  {
    firstname: 'Biswajit',
    lastname: 'Debnath',
    email: 'biswajit.sust@gmail.com',
    timestamp: '2022-01-31T00:00:00.000Z',
  },
  {
    firstname: 'Kazi',
    lastname: 'Nayeem',
    email: 'masum.nayeem@gmail.com',
    timestamp: '2022-01-31T00:00:00.000Z',
  },
];

getMatchedGroups(allUsersortedByLastMeetingDate);
