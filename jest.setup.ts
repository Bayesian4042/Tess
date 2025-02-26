import '@testing-library/jest-dom';
import 'jest-extended';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
	useSession: jest.fn(),
}));
