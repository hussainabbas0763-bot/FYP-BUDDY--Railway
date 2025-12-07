import { createSlice } from "@reduxjs/toolkit";

const supervisedGroupsSlice = createSlice({
    name: "supervised_groups",
    initialState: {
        supervised_groups: [],
    },
    reducers: {
        setSupervisedGroups: (state, action) => {
            state.supervised_groups = action.payload;
        }
    }
});
export const { setSupervisedGroups } = supervisedGroupsSlice.actions;
export default supervisedGroupsSlice.reducer;