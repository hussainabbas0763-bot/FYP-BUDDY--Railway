import { createSlice } from "@reduxjs/toolkit";

const milestoneSlice = createSlice({
    name:"milestone",
    initialState:{
        milestone: null
    },
    reducers:{
        setMilestone:(state, action) => {
            state.milestone = action.payload;
        }
    }
});
export const {setMilestone} = milestoneSlice.actions;
export default milestoneSlice.reducer;