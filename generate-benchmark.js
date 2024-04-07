import { faker } from "@faker-js/faker";
import fs from "fs";

faker.seed(1337);
console.log("Running with seed: " + faker.seed);

// Set the number of departments and sub-departments per department
const numDepartments = 4000;
const subDepartmentLevel = 50;
const teamMinSize = 4;
const teamMaxSize = 7;

// Create an object that represents the organization with the specified number of departments
const organization = {
  name: faker.company.name(),
  location: faker.location.city() + ", " + faker.location.country(),
  departments: [],
  ceo: {
    name: faker.person.fullName(),
    title: faker.person.jobTitle(),
  },
};

function createTeam(faker) {
  const team = [];
  const teamSize = Math.random() * (teamMaxSize - teamMinSize) + teamMinSize;
  for (let i = 0; i < teamSize; i++) {
    team.push({
      name: faker.person.fullName(),
      title: faker.person.jobTitle(),
      skills: [1, 2, 3, 4, 5].map(() => faker.lorem.word()),
    });
  }

  return team;
}

// Generate the specified number of departments and populate the organization object
for (let i = 0; i < numDepartments; i++) {
  const department = {
    name: faker.company.name(),
    employees: faker.string.numeric({ min: 10, max: 100 }),
    isRemote: Math.random() > 0.5,
    creationDate: faker.date.past(),
    location: {
      city: faker.location.city(),
      street: faker.location.street(),
    },
    areNice: faker.lorem.word(),
    budget: faker.commerce.price({ min: 100, max: 1000 }),
    manager: {
      name: faker.person.fullName(),
      title: faker.person.jobTitle(),
    },
    subDepartments: [],
  };

  // Generate sub-departments up to the specified level
  for (let j = 0; j < subDepartmentLevel; j++) {
    if (j > 0) {
      department.subDepartments[j - 1].subDepartments = [];
    }
    const subDepartment = {
      name: faker.company.name(),
      employees: faker.string.numeric({ length: { min: 2, max: 3 } }),
      isRemote: Math.random() > 0.5,
      description: faker.lorem.sentence(),
      budget: faker.commerce.price({ min: 100, max: 1000 }),
      team: createTeam(faker),
      manager: {
        name: faker.person.fullName(),
        title: faker.person.jobTitle(),
      },
    };
    department.subDepartments[j] = subDepartment;
  }

  organization.departments.push(department);
}

// Convert the organization object to a JSON string and save it to a file
const jsonString = JSON.stringify(organization, null, 2);
fs.writeFileSync("test/benchmark.json", jsonString);
