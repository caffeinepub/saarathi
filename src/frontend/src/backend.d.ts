import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    username: string;
    displayName: string;
    password: string;
    role: UserRole;
    businessName: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllUsersByUsername(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    login(username: string, password: string): Promise<void>;
    registerUser(username: string, displayName: string, businessName: string, password: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateUserProfile(updatedProfile: UserProfile): Promise<void>;
}
