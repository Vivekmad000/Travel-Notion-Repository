"use client";

import { UserButton } from "@clerk/nextjs";

export function AppUserButton() {
  return (
    <UserButton
      userProfileProps={{
        appearance: {
          elements: {
            profileSectionPrimaryButton__emailAddresses: { display: "none" },
            profileSectionPrimaryButton__phoneNumbers: { display: "none" },
            profileSection__name: { display: "none" },
          },
        },
      }}
    />
  );
}
