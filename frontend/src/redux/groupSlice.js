import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name:"group",
    initialState:{
        group: null
    },
    reducers:{
        setGroup:(state, action) => {
            state.group = action.payload;
        }
    }
});
export const {setGroup} = authSlice.actions;
export default authSlice.reducer;