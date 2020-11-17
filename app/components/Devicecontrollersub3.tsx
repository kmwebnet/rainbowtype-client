import React from 'react';
import TextField from '@material-ui/core/TextField';

// This element is only used by setting url

type Props = {
  data: string;
  setdata: (d: string) => void;
};

function Devicecontrollersub3({ data, setdata }: Props) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setdata(event.target.value);
  };

  return (
    <TextField
      id="outlined-full-width"
      label="URL:"
      style={{ margin: 8 }}
      placeholder="Placeholder"
      multiline
      fullWidth
      margin="normal"
      InputLabelProps={{
        shrink: true,
      }}
      variant="outlined"
      value={data}
      onChange={handleChange}
    />
  );
}

export default Devicecontrollersub3;
