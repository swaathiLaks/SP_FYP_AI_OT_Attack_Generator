import uuid
from openai import OpenAI
import os
from dotenv import load_dotenv
from app.modules.add_data import retrieve

# Load environment variables
load_dotenv("apikey.env")
CALDERA_PATH = '/home/kali/caldera'

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def generate_attack(data, user_id):
    vector = data.get('vector')
    target = data.get('target')

    try:
        retrieved_docs = await retrieve(vector)
        retrieved_doc_string = "".join(f"- {i.page_content}\n" for i in retrieved_docs)
        
        # Update the prompt to reflect the desired structure
        prompt = f"""
        Generate a powershell commands for a {vector} attack against the target {target} in a cybersecurity exercise. 
        The powershell commands must include realistic attack commands and focus on exploiting known vulnerabilities. 
        Use Collection, Command-and-Control, Credential-Access, Defense-Evasion, Discovery, Execution, 
        Exfiltration, Impact, Initial-Access, Lateral-Movement, Multiple, Persistence, Privilege-Escalation or Reconnaissance based on the attack vector and target.

        Generate the powershell commands. (DO NOT include any explanations or comments in the powershell commands itself. Do not label the commands. Do not add descriptions. You do not have to mention the tactic.) For example, your response should look like (Please do not add anything more than whats shown below):

        - ps: ipconfig
        - ps: cd caldera
        - ps: cd plugins
        - ps: another command
        ... a few more commands
        """ 

        generated_scripts = {}

        # Generate 3 attack scripts
        for i in range(3):
            try:
                # Generate unique script UUID
                script_uuid = str(uuid.uuid4())

                response = client.chat.completions.create(
                    messages=[ 
                        {"role": "system", "content": (
                            "You are a cybersecurity expert creating YAML scripts for red team exercises. "
                            "Focus on providing safe, ethical, and educational code comments in the script generation.")},
                        {"role": "user", "content": prompt}
                    ],
                    model="gpt-3.5-turbo",
                    max_tokens=1500
                )

                # Extract response content
                script_content = response.choices[0].message.content.strip()        

                script_content = script_content.replace('```yaml\n', '').replace('```', '').strip()    

                # Directly use the script content as the attack script
                script_part = f"{script_content}"                   

                # Validate script part
                if not script_part:
                    raise ValueError("Script section is missing or could not be extracted.")

                # AI generates a dry run report for the script's behavior
                dry_run_report_prompt = f"""
                Based on the following attack script, generate a dry run report explaining what the code does step-by-step:
                {script_part}

                Focus on explaining the:
                1. Attack vector and tactic used.
                2. Purpose and function of each command and executor.
                3. Potential outcomes, system impacts, or any changes that would occur on the target machine or network.
                """

                # Ask the AI to generate the dry run report for the attack script
                dry_run_response = client.chat.completions.create(
                    messages=[ 
                        {"role": "system", "content": "You are an expert in red team operations and can explain attack scripts in detail."},
                        {"role": "user", "content": dry_run_report_prompt}
                    ],
                    model="gpt-3.5-turbo",
                    max_tokens=1500
                )

                # Extract the dry run report
                dry_run_report = dry_run_response.choices[0].message.content.strip()

                generated_scripts[script_uuid] = {
                    "script_id": script_uuid,
                    "name": f"Generated {vector} attack on {target} - Script {i+1}",
                    "script": script_part,  # Separate the script from the explanation
                    "explanation": f"{dry_run_report}",  # Detailed explanation of what the script does
                }

            except Exception as e:
                print(f"Error generating attack script: {str(e)}")
                return {"error": f"Error generating attack script: {str(e)}"}

        return generated_scripts

    except Exception as e:
        print(f"Error in generate_attack function: {str(e)}")
        return {"error": f"Error in generate_attack function: {str(e)}"}